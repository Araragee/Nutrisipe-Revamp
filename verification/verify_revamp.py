import sys
import asyncio
from playwright.async_api import async_playwright
import os

async def verify_revamp():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800}
        )

        page = await context.new_page()

        # Mock Auth API
        await page.route("**/api/auth/me", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"success": true, "data": {"id": "user-123", "email": "demo@example.com", "displayName": "Demo User", "username": "demouser", "avatarUrl": null, "role": "USER", "settings": {"darkMode": false}}}'
        ))

        # Mock Feed API
        mock_posts = '[{"id":"post-1","userId":"user-123","title":"Avocado Toast","description":"Healthy breakfast","imageUrl":"https://images.unsplash.com/photo-1525351484163-7529414344d8","category":"recipe","tags":["healthy","quick"],"likeCount":42,"saveCount":10,"commentCount":5,"isPublic":true,"createdAt":"2023-01-01T00:00:00Z","updatedAt":"2023-01-01T00:00:00Z","user":{"id":"user-123","displayName":"Demo Chef","username":"demochef","avatarUrl":null},"isLiked":false,"isSaved":false,"recipe":{"ingredients":[{"name":"Avocado","qty":"1"}],"instructions":[{"step":1,"text":"Toast bread"}],"nutrition":{"calories":300}}}]'

        await page.route("**/api/posts/feed**", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"success": true, "data": ' + mock_posts + ', "pagination": {"total": 1, "page": 1, "limit": 20, "totalPages": 1}}'
        ))

        print("Starting verification...")

        await page.goto("http://localhost:5173/")
        await page.evaluate("localStorage.setItem('auth_token', 'mock-token')")
        await page.goto("http://localhost:5173/")

        await page.wait_for_load_state("networkidle")

        # Give it time for both /me and /feed to complete
        await asyncio.sleep(5)

        # Check shell visibility
        shell_visible = await page.locator(".app-shell").is_visible()
        print(f"App shell visible: {shell_visible}")

        # Check for recipe card (pin-card in PinGrid)
        try:
            await page.wait_for_selector(".pin-card, .recipe-card", timeout=10000)
            print("Recipe cards rendered successfully")
        except:
            print("FAILED: Recipe cards not found")
            await page.screenshot(path="verification/screenshots/final_error.png")
            await browser.close()
            return

        print("Verification complete!")
        await browser.close()

if __name__ == "__main__":
    if not os.path.exists("verification/screenshots"):
        os.makedirs("verification/screenshots")
    asyncio.run(verify_revamp())
