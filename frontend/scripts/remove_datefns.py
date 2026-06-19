import re
with open('/Users/dex/Documents/Nutrisipe-Revamp/frontend/src/views/MessagesView.vue', 'r') as f:
    content = f.read()

# Remove import
content = re.sub(r"import \{ formatDistanceToNow \} from 'date-fns'\n", "", content)

# Replace formatTime
new_format = """function formatTime(timestamp: string) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diffInSeconds = (new Date(timestamp).getTime() - Date.now()) / 1000
  const absDiff = Math.abs(diffInSeconds)
  
  if (absDiff < 60) return rtf.format(Math.round(diffInSeconds), 'second')
  if (absDiff < 3600) return rtf.format(Math.round(diffInSeconds / 60), 'minute')
  if (absDiff < 86400) return rtf.format(Math.round(diffInSeconds / 3600), 'hour')
  if (absDiff < 2592000) return rtf.format(Math.round(diffInSeconds / 86400), 'day')
  if (absDiff < 31536000) return rtf.format(Math.round(diffInSeconds / 2592000), 'month')
  return rtf.format(Math.round(diffInSeconds / 31536000), 'year')
}"""

old_format_pattern = r"function formatTime\(timestamp: string\) \{\n\s*return formatDistanceToNow\(new Date\(timestamp\), \{ addSuffix: true \}\)\n\}"
content = re.sub(old_format_pattern, new_format, content)

with open('/Users/dex/Documents/Nutrisipe-Revamp/frontend/src/views/MessagesView.vue', 'w') as f:
    f.write(content)
