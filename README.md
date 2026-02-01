# Sushant Sikare - Personal Portfolio

A minimalist personal portfolio and blog website.

## 🚀 Quick Start

1. **Open locally**: Simply open `index.html` in your browser
2. **Or use a local server**:
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx serve
   ```

## 📁 Structure

```
personal-site/
├── index.html          # Home/Blog listing
├── about.html          # About Me page
├── projects.html       # Projects portfolio
├── blog/
│   └── *.html          # Blog posts (add new posts here)
├── css/
│   └── style.css       # All styles
├── js/
│   └── main.js         # Theme toggle & Mermaid init
└── assets/
    └── images/         # Blog images (create as needed)
```

## ✍️ Adding a New Blog Post

1. Copy `blog/building-production-ai-agents.html` as a template
2. Update the content, title, and meta description
3. Add a link to the new post in `index.html`

### Using Diagrams

Add Mermaid diagrams in your posts:

```html
<div class="mermaid">
flowchart LR
    A[Start] --> B[Process] --> C[End]
</div>
```

### Using Code Blocks

```html
<pre><code>def hello():
    print("Hello, World!")</code></pre>
```

## 🌐 Deploy to GitHub Pages

1. Create a new repository on GitHub
2. Push this folder to the repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. Go to **Settings → Pages**
4. Set source to `main` branch, root folder
5. Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO/`

## 🔗 Custom Domain Setup (sush24.com)

Your domain is configured! Here's how to complete setup:

### 1. GitHub Repository Setup
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/sushant-sikare/sush24.com.git
git push -u origin main
```

### 2. GitHub Pages Settings
1. Go to **Settings → Pages**
2. Set source to `main` branch, root folder
3. Under "Custom domain", enter: `sush24.com`
4. Check "Enforce HTTPS"

### 3. Domain DNS Configuration
At your domain registrar, add these DNS records:

**Option A: CNAME (recommended for apex domain)**
| Type | Host | Value |
|------|------|-------|
| CNAME | www | sushant-sikare.github.io |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

**Note**: DNS propagation can take up to 24 hours.

### 4. Verify
Once DNS propagates, your site will be live at:
- https://sush24.com
- https://www.sush24.com

## 🎨 Customization

### Colors
Edit CSS variables in `css/style.css`:
```css
:root {
  --accent: #3b82f6;  /* Change primary accent color */
}
```

### Social Links
Update links in the footer section of each HTML file.

### Personal Info
Update name, title, and bio in each HTML file.

## 📄 License

MIT License - Feel free to use and modify.
