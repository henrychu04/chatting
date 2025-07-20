# Message Sanitization Examples

This document shows how the sanitization library handles different types of input.

## Chat Message Sanitization (`sanitizeChatMessage`)

### ✅ Allowed Content

```javascript
sanitizeChatMessage('Hello <b>world</b>!');
// → 'Hello <b>world</b>!'

sanitizeChatMessage('Check out <a href="https://example.com">this link</a>');
// → 'Check out <a href="https://example.com">this link</a>'

sanitizeChatMessage('Some <em>emphasis</em> and <code>code</code>');
// → 'Some <em>emphasis</em> and <code>code</code>'

sanitizeChatMessage('Line 1<br>Line 2');
// → 'Line 1<br>Line 2'
```

### 🚫 Blocked/Sanitized Content

```javascript
sanitizeChatMessage('<script>alert("xss")</script>');
// → ''

sanitizeChatMessage('<img src="x" onerror="alert(1)">');
// → '<img src="x">'

sanitizeChatMessage('<a href="javascript:alert(1)">click</a>');
// → '<a>click</a>'

sanitizeChatMessage('<div onclick="alert(1)">text</div>');
// → 'text'

sanitizeChatMessage('<style>body{display:none}</style>');
// → ''
```

## Username Sanitization (`sanitizeUsername`)

### ✅ Valid Usernames

```javascript
sanitizeUsername('JohnDoe123');
// → 'JohnDoe123'

sanitizeUsername('user-name_2024');
// → 'user-name_2024'

sanitizeUsername('  spaced name  ');
// → 'spaced name'
```

### 🔧 Cleaned Usernames

```javascript
sanitizeUsername('<script>alert(1)</script>');
// → 'scriptalert1script'

sanitizeUsername('user@domain.com');
// → 'userdomain.com'

sanitizeUsername('very_long_username_that_exceeds_the_fifty_character_limit_for_usernames');
// → 'very_long_username_that_exceeds_the_fifty_chara'

sanitizeUsername('');
// → 'Anonymous'
```

## Suspicious Content Detection

```javascript
containsSuspiciousContent('<script>alert(1)</script>');
// → true

containsSuspiciousContent('javascript:alert(1)');
// → true

containsSuspiciousContent('Hello world!');
// → false

containsSuspiciousContent('<img onload="alert(1)" src="x">');
// → true
```

## Security Levels

### Strict Mode (Plain text only)

```javascript
sanitizeStrict('<b>Hello</b> <script>alert(1)</script>');
// → 'Hello '

sanitizeStrict('Line 1<br>Line 2');
// → 'Line 1<br>Line 2'  // Only <br> allowed
```

### Rich Mode (More formatting)

```javascript
sanitizeRich('<p>Paragraph with <ul><li>list items</li></ul></p>');
// → '<p>Paragraph with <ul><li>list items</li></ul></p>'

sanitizeRich('<blockquote>Quote</blockquote>');
// → '<blockquote>Quote</blockquote>'
```

## Usage in Chat Application

1. **Server-side**: All incoming messages are sanitized before broadcasting
2. **Client-side**: Messages are sanitized again when displaying (defense in depth)
3. **Username protection**: Usernames are cleaned to prevent injection
4. **Suspicious content blocking**: Potentially harmful patterns are detected and blocked

## Supported HTML Tags (Chat Mode)

- `<b>`, `<strong>` - Bold text
- `<i>`, `<em>` - Italic text
- `<u>` - Underlined text
- `<code>` - Inline code
- `<br>` - Line breaks
- `<a href="...">` - Links (safe URLs only)

## Blocked Elements

- `<script>` - JavaScript execution
- `<iframe>` - Embedded content
- `<object>`, `<embed>` - Plugin content
- `<style>` - CSS injection
- `<form>` - Form elements
- Event handlers (`onclick`, `onload`, etc.)
- `javascript:` URLs
- `data:` URLs (except safe ones)
