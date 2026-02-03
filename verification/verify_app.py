from playwright.sync_api import sync_playwright
import json

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    # Mock at context level to ensure it applies to all pages/navs

    # Mock Login
    def handle_login(route):
        print(f"Handling login mock: {route.request.url}")
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "success": True,
                "data": {
                    "token": "fake-token",
                    "user": {
                        "id": "1",
                        "username": "testuser",
                        "displayName": "Test User",
                        "email": "test@test.com",
                        "avatarUrl": "https://ui-avatars.com/api/?name=Test+User",
                        "role": "USER",
                        "followerCount": 10,
                        "followingCount": 5
                    }
                }
            })
        )
    context.route("**/api/auth/login", handle_login)

    # Mock Me
    def handle_me(route):
        print(f"Handling me mock: {route.request.url}")
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "success": True,
                "data": {
                    "id": "1",
                    "username": "testuser",
                    "displayName": "Test User",
                    "email": "test@test.com",
                    "avatarUrl": "https://ui-avatars.com/api/?name=Test+User",
                    "role": "USER",
                    "followerCount": 10,
                    "followingCount": 5
                }
            })
        )
    context.route("**/api/auth/me*", handle_me)

    # Mock Posts Feed
    def handle_posts(route):
        print(f"Handling posts mock: {route.request.url}")
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "success": True,
                "data": [
                    {
                        "id": "1",
                        "title": "Delicious Pasta",
                        "description": "Best pasta ever",
                        "imageUrl": "https://via.placeholder.com/300",
                        "category": "Dinner",
                        "tags": ["pasta", "food"],
                        "likeCount": 100,
                        "saveCount": 20,
                        "commentCount": 5,
                        "user": {
                            "id": "2",
                            "username": "chef",
                            "displayName": "Chef Gordon",
                            "avatarUrl": "https://ui-avatars.com/api/?name=Chef",
                            "isFollowing": False
                        },
                        "isLiked": False,
                        "isSaved": False
                    },
                    {
                        "id": "2",
                        "title": "Vegan Burger",
                        "description": "Healthy and tasty",
                        "imageUrl": "https://via.placeholder.com/300",
                        "category": "Vegan",
                        "tags": ["burger", "vegan"],
                        "likeCount": 50,
                        "saveCount": 10,
                        "commentCount": 2,
                        "user": {
                            "id": "3",
                            "username": "veganlover",
                            "displayName": "Vegan Lover",
                            "avatarUrl": "https://ui-avatars.com/api/?name=Vegan",
                            "isFollowing": False
                        },
                        "isLiked": True,
                        "isSaved": False
                    }
                ],
                "pagination": {
                    "page": 1,
                    "limit": 20,
                    "total": 2,
                    "totalPages": 1
                }
            })
        )
    context.route("**/api/posts/feed*", handle_posts)

    # Mock Notifications
    def handle_notifications(route):
        route.fulfill(status=200, body=json.dumps({"success": True, "data": []}))
    context.route("**/api/notifications*", handle_notifications)

    # Mock User Suggestions
    def handle_suggestions(route):
        route.fulfill(status=200, body=json.dumps({"success": True, "data": []}))
    context.route("**/api/users/suggestions*", handle_suggestions)

    # Mock User Activity
    def handle_activity(route):
        route.fulfill(status=200, body=json.dumps({"success": True, "data": []}))
    context.route("**/api/users/*/activity*", handle_activity)

    # Mock Categories
    def handle_categories(route):
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "success": True,
                "data": [
                    {"name": "Dinner", "count": 10},
                    {"name": "Vegan", "count": 5}
                ]
            })
        )
    context.route("**/api/search/categories", handle_categories)

    # Mock Trending
    def handle_trending(route):
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "success": True,
                "data": []
            })
        )
    context.route("**/api/search/trending*", handle_trending)

    page = context.new_page()
    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
    page.on("request", lambda request: print(f"Request: {request.method} {request.url}"))
    page.on("requestfailed", lambda request: print(f"Request failed: {request.url} {request.failure}"))

    # Start Test
    print("Navigating to login...")
    page.goto("http://localhost:5173/login")

    # Fill Login
    print("Filling login form...")
    page.fill("input[type='email']", "test@test.com")
    page.fill("input[type='password']", "password")
    page.click("button[type='submit']")

    # Wait for navigation
    print("Waiting for feed...")
    page.wait_for_url("http://localhost:5173/")

    # Verify Feed
    print("Verifying feed...")
    page.wait_for_selector("text=Delicious Pasta")

    # Screenshot Feed
    page.screenshot(path="verification/feed.png")
    print("Feed screenshot taken.")

    # Navigate to Explore
    print("Navigating to explore...")
    page.goto("http://localhost:5173/explore")

    # Verify Explore
    print("Verifying explore...")
    page.wait_for_selector("text=Browse by Category")

    # Screenshot Explore
    page.screenshot(path="verification/explore.png")
    print("Explore screenshot taken.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
