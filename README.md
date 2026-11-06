# Tastes of Africa

Taste of Africa Project by Mufaro Victoria Kunze

One continent. Endless flavours.

Tastes of Africa is a multi-page static website that celebrates the dishes, the people and the stories behind African food. It has five recipes (Jollof Rice, Groundnut Stew, Zanzibar Pilau, Chakalaka and Sadza), three region guides (West, East and Southern Africa), an About page and a Contact page.

## Tech used

- HTML5 with semantic landmarks (header, nav, main, section, article, aside, figure, footer)
- CSS with custom properties, Grid, Flexbox, clamp() and media queries (mobile first, breakpoints around 600px and 960px)
- Vanilla JavaScript (no frameworks or libraries)
- Google Fonts (Baloo 2 and Poppins), YouTube privacy embeds and Google Maps embeds

## Folder structure

```plaintext
taste_of_africa_website_project/
├── index.html               Home page
├── home.html                Forwards old links to index.html
├── recipes.html             All recipes, with region filter
├── regions.html             Overview of the three regions
├── about.html               Mission, history and map
├── contact.html             Contact form
├── recipes/                 One page per recipe
│   ├── jollof-rice.html
│   ├── groundnut-stew.html
│   ├── zanzibar-pilau.html
│   ├── chakalaka.html
│   └── sadza.html
├── regions/                 One page per region
│   ├── west-africa.html
│   ├── east-africa.html
│   └── southern-africa.html
├── images/                  Photos (added manually, see TODO-assets.md)
│   ├── dishes/
│   ├── regions/
│   └── trends/
├── style.css                Global stylesheet
├── script.js                All interactivity
├── README.md
└── TODO-assets.md           Checklist of images and video IDs to add
```

## How to open locally

1. Download or clone the project folder.
2. Open `index.html` in any modern browser by double clicking it.
3. For the closest match to GitHub Pages, you can instead serve the folder, for example with the VS Code Live Server extension.

All paths are relative, so the site works from the repository root on GitHub Pages.

## Images and videos

Photos and YouTube video IDs are added by hand. Until a photo exists, each image slot shows a patterned placeholder with the dish or region name. Every YouTube embed uses `REPLACE_ME` as its ID. See `TODO-assets.md` for the full list.

## JavaScript features

1. Light and dark theme toggle, saved in localStorage and defaulting to the device preference
2. Accessible mobile menu with aria-expanded
3. Recipe filter by region, with a live "Showing N recipes" count
4. Favorites: heart buttons saved in localStorage (`toaFavorites`), with a saved count beside the Recipes link
5. Servings scaler on recipe pages that recalculates every ingredient amount
6. Contact form check (message must be more than 20 characters), character counter and safe thank you message
7. Newsletter sign up in the footer with a simple email check
8. Gentle scroll reveal using IntersectionObserver, skipped for reduced motion
9. Missing image handler that swaps broken images for the designed placeholder
