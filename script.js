/* ==========================================================================
   Tastes of Africa: site script
   Every feature checks that its elements exist before running, so the same
   file can be loaded on every page without causing errors.
   ========================================================================== */

// Tell the stylesheet that JavaScript is running (used for the mobile menu).
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", function () {
    const FAVORITES_KEY = "toaFavorites";
    const THEME_KEY = "toaTheme";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setupImageFallbacks();
    setupThemeToggle();
    setupMobileMenu();
    setupRecipeFilter();
    setupFavorites();
    setupIngredientScaler();
    setupContactForm();
    setupNewsletter();
    setupScrollReveal();

    /* ----------------------------------------------------------------------
       1. Theme toggle
       Reads a saved choice first, falls back to the device preference, and
       saves any change the visitor makes.
       ---------------------------------------------------------------------- */
    function setupThemeToggle() {
        const button = document.querySelector(".theme-toggle");
        let saved = null;

        try {
            saved = localStorage.getItem(THEME_KEY);
        } catch (error) {
            saved = null;
        }

        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyTheme(saved || (prefersDark ? "dark" : "light"));

        if (!button) {
            return;
        }

        button.addEventListener("click", function () {
            const current = document.documentElement.getAttribute("data-theme");
            const next = current === "dark" ? "light" : "dark";
            applyTheme(next);

            try {
                localStorage.setItem(THEME_KEY, next);
            } catch (error) {
                // Storage can be blocked in private windows. The theme still
                // changes for this visit, it just will not be remembered.
            }
        });
    }

    // Sets the theme on <html> and keeps the toggle button's label in step.
    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        const button = document.querySelector(".theme-toggle");

        if (button) {
            const isDark = theme === "dark";
            button.setAttribute("aria-pressed", String(isDark));
            button.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
        }
    }

    /* ----------------------------------------------------------------------
       2. Mobile menu
       Opens and closes the navigation on small screens and keeps
       aria-expanded accurate for screen readers.
       ---------------------------------------------------------------------- */
    function setupMobileMenu() {
        const toggle = document.querySelector(".menu-toggle");
        const nav = document.getElementById("site-nav");

        if (!toggle || !nav) {
            return;
        }

        toggle.addEventListener("click", function () {
            const isOpen = toggle.getAttribute("aria-expanded") === "true";
            toggle.setAttribute("aria-expanded", String(!isOpen));
            nav.classList.toggle("is-open", !isOpen);
        });

        // Close the menu with the Escape key and return focus to the button.
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && nav.classList.contains("is-open")) {
                toggle.setAttribute("aria-expanded", "false");
                nav.classList.remove("is-open");
                toggle.focus();
            }
        });
    }

    /* ----------------------------------------------------------------------
       3. Recipe filter (recipes page)
       Each button has a data-filter value. Cards whose data-region does not
       match get the .hidden class, and the live count is updated.
       ---------------------------------------------------------------------- */
    function setupRecipeFilter() {
        const buttons = document.querySelectorAll(".filter-btn");
        const cards = document.querySelectorAll(".recipe-card");
        const count = document.getElementById("recipe-count");

        if (buttons.length === 0 || cards.length === 0) {
            return;
        }

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                const filter = button.dataset.filter;
                let shown = 0;

                // Show or hide each card depending on its region.
                for (const card of cards) {
                    const matches = filter === "all" || card.dataset.region === filter;
                    card.classList.toggle("hidden", !matches);
                    if (matches) {
                        shown++;
                    }
                }

                // Only the clicked button is marked as pressed.
                buttons.forEach(function (other) {
                    other.setAttribute("aria-pressed", String(other === button));
                });

                if (count) {
                    count.textContent = "Showing " + shown + (shown === 1 ? " recipe" : " recipes");
                }
            });
        });
    }

    /* ----------------------------------------------------------------------
       4. Favorites
       Saved recipe IDs live in localStorage under "toaFavorites" as an array.
       ---------------------------------------------------------------------- */

    // Reads the saved list safely. Bad or missing data gives an empty list.
    function readFavorites() {
        try {
            const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY));
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    // Writes the list back to localStorage.
    function saveFavorites(list) {
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
        } catch (error) {
            // Nothing else to do if storage is unavailable.
        }
    }

    // Updates one button so its heart, label and aria-pressed match its state.
    function paintFavoriteButton(button, isSaved) {
        const label = button.querySelector(".favorite-label");
        button.setAttribute("aria-pressed", String(isSaved));
        if (label) {
            label.textContent = isSaved ? "Saved" : "Favorite";
        }
    }

    // Shows how many recipes are saved beside the Recipes link in the nav.
    function updateFavoriteCount(list) {
        const badges = document.querySelectorAll(".fav-count");
        badges.forEach(function (badge) {
            if (list.length > 0) {
                badge.textContent = list.length;
                badge.setAttribute("aria-label", list.length + " saved");
                badge.hidden = false;
            } else {
                badge.textContent = "";
                badge.hidden = true;
            }
        });
    }

    // Restores saved buttons on load and listens for clicks.
    function setupFavorites() {
        const buttons = document.querySelectorAll(".favorite-btn");
        const favorites = readFavorites();

        updateFavoriteCount(favorites);

        buttons.forEach(function (button) {
            paintFavoriteButton(button, favorites.includes(button.dataset.id));

            button.addEventListener("click", function () {
                const id = button.dataset.id;
                let list = readFavorites();
                const isSaved = list.includes(id);

                if (isSaved) {
                    list = list.filter(function (item) {
                        return item !== id;
                    });
                } else {
                    list.push(id);
                }

                saveFavorites(list);

                // The same recipe can appear more than once on a page,
                // so update every button that shares this ID.
                document.querySelectorAll('.favorite-btn[data-id="' + id + '"]').forEach(function (match) {
                    paintFavoriteButton(match, !isSaved);
                });

                updateFavoriteCount(list);
            });
        });
    }

    /* ----------------------------------------------------------------------
       5. Ingredient scaler (recipe pages)
       Every ingredient with data-amount is recalculated for the chosen
       number of servings. Items without an amount are left alone.
       ---------------------------------------------------------------------- */

    // Singular and plural words for each unit. "whole" items have no unit word.
    const UNIT_WORDS = {
        cup: ["cup", "cups"],
        cups: ["cup", "cups"],
        tbsp: ["tablespoon", "tablespoons"],
        tsp: ["teaspoon", "teaspoons"],
        g: ["g", "g"],
        tin: ["tin", "tins"],
        whole: ["", ""]
    };

    // Rounds a scaled amount to something a cook would actually measure.
    function roundAmount(value, unit) {
        if (unit === "g") {
            return Math.max(5, Math.round(value / 5) * 5);
        }
        if (unit === "whole" || unit === "tin") {
            return Math.max(0.5, Math.round(value * 2) / 2);
        }
        return Math.max(0.1, Math.round(value * 10) / 10);
    }

    // Turns a number and unit into display text, for example "1.5 cups".
    function formatQuantity(amount, unit) {
        const number = Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
        const words = UNIT_WORDS[unit] || [unit, unit];
        const word = amount <= 1 ? words[0] : words[1];
        return word ? number + " " + word : number;
    }

    function setupIngredientScaler() {
        const input = document.getElementById("servings");
        const list = document.querySelector(".ingredients");

        if (!input || !list) {
            return;
        }

        const baseServings = Number(list.dataset.baseServings) || 4;
        const items = list.querySelectorAll("li[data-amount]");
        const servingsText = document.getElementById("servings-text");

        // Recalculates every quantity for the current input value.
        function rescale() {
            let servings = parseInt(input.value, 10);

            // Ignore empty input while the visitor is still typing.
            if (Number.isNaN(servings)) {
                return;
            }

            servings = Math.min(12, Math.max(1, servings));
            const factor = servings / baseServings;

            for (const item of items) {
                const base = parseFloat(item.dataset.amount);
                const unit = item.dataset.unit;
                const qty = item.querySelector(".qty");
                if (qty) {
                    qty.textContent = formatQuantity(roundAmount(base * factor, unit), unit);
                }
            }

            if (servingsText) {
                servingsText.textContent = servings === 1 ? "1 serving" : servings + " servings";
            }
        }

        input.addEventListener("input", rescale);

        // On leaving the field, snap any out of range number back inside 1 to 12.
        input.addEventListener("change", function () {
            const value = parseInt(input.value, 10);
            input.value = Number.isNaN(value) ? baseServings : Math.min(12, Math.max(1, value));
            rescale();
        });
    }

    /* ----------------------------------------------------------------------
       6. Contact form
       Native HTML checks still run first. This adds a minimum message length,
       a live character counter and a friendly thank you message.
       ---------------------------------------------------------------------- */
    function setupContactForm() {
        const form = document.getElementById("contact-form");

        if (!form) {
            return;
        }

        const nameInput = document.getElementById("name");
        const message = document.getElementById("message");
        const errorBox = document.getElementById("form-error");
        const success = document.getElementById("form-success");
        const counter = document.getElementById("char-count");
        const MIN_LENGTH = 21;

        // Keeps the character counter under the message box up to date.
        function updateCounter() {
            if (!counter || !message) {
                return;
            }
            const length = message.value.trim().length;
            counter.textContent = length + " characters (at least " + MIN_LENGTH + " needed)";
        }

        if (message) {
            message.addEventListener("input", function () {
                updateCounter();
                // Clear the error once the message is long enough.
                if (errorBox && message.value.trim().length >= MIN_LENGTH) {
                    errorBox.textContent = "";
                    message.removeAttribute("aria-invalid");
                }
            });
            updateCounter();
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const text = message ? message.value.trim() : "";

            if (text.length <= 20) {
                if (errorBox) {
                    errorBox.textContent = "Please write a little more, at least 21 characters. You have " + text.length + " so far.";
                }
                message.setAttribute("aria-invalid", "true");
                message.focus();
                return;
            }

            if (errorBox) {
                errorBox.textContent = "";
            }

            // Build the thank you message with textContent so whatever the
            // visitor typed is shown as plain text, never as HTML.
            const name = nameInput ? nameInput.value.trim() : "";
            const heading = document.createElement("p");
            heading.textContent = "Thank you, " + (name || "friend") + "! We've received your message.";

            if (success) {
                success.replaceChildren(heading);
                success.hidden = false;
                form.hidden = true;
                success.setAttribute("tabindex", "-1");
                success.focus();
            }
        });
    }

    /* ----------------------------------------------------------------------
       7. Newsletter sign up (footer on every page)
       ---------------------------------------------------------------------- */
    function setupNewsletter() {
        const forms = document.querySelectorAll(".newsletter-form");

        forms.forEach(function (form) {
            const input = form.querySelector("input[type='email']");
            const fieldArea = form.querySelector(".field-inline");
            const output = form.querySelector(".newsletter-message");

            form.addEventListener("submit", function (event) {
                event.preventDefault();

                const email = input ? input.value.trim() : "";
                // A simple shape check: something@something.something
                const looksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

                if (!looksValid) {
                    if (output) {
                        output.textContent = "Please enter a valid email address, like name@example.com.";
                    }
                    if (input) {
                        input.focus();
                    }
                    return;
                }

                if (fieldArea) {
                    fieldArea.hidden = true;
                }
                if (output) {
                    output.textContent = "Thanks for subscribing! Look out for new recipes in your inbox.";
                }
            });
        });
    }

    /* ----------------------------------------------------------------------
       8. Scroll reveal
       Elements with .reveal fade and rise into view once. Skipped entirely
       when the visitor prefers reduced motion or the browser lacks support.
       ---------------------------------------------------------------------- */
    function setupScrollReveal() {
        const items = document.querySelectorAll(".reveal");

        if (items.length === 0 || reduceMotion || !("IntersectionObserver" in window)) {
            return;
        }

        document.documentElement.classList.add("reveal-ready");

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

        items.forEach(function (item) {
            observer.observe(item);
        });
    }

    /* ----------------------------------------------------------------------
       9. Missing images
       If a photo has not been added yet, mark its slot with .is-missing so
       the patterned placeholder shows instead of a broken image icon.
       ---------------------------------------------------------------------- */
    function setupImageFallbacks() {
        const images = document.querySelectorAll(".slot img");

        images.forEach(function (img) {
            const slot = img.closest(".slot");

            // Marks the slot as missing its photo.
            function markMissing() {
                if (slot) {
                    slot.classList.add("is-missing");
                }
            }

            // The image may have already failed before this script ran.
            if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
                markMissing();
            }

            img.addEventListener("error", markMissing);
        });
    }
});
