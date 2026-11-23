/* ChronoCloud365 - site interactions
   Vanilla JS, no dependencies. Every feature degrades gracefully. */

(function () {
  "use strict";

  var root = document.documentElement;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------- theme */

  function getStoredTheme() {
    try {
      return localStorage.getItem("cc-theme");
    } catch (e) {
      return null;
    }
  }

  function setStoredTheme(value) {
    try {
      localStorage.setItem("cc-theme", value);
    } catch (e) {
      /* storage unavailable - theme still applies for this page view */
    }
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#101619" : "#FFFFFF");
  }

  (function initTheme() {
    var stored = getStoredTheme();
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var forced = new URLSearchParams(window.location.search).get("theme");
    if (forced === "dark" || forced === "light") {
      applyTheme(forced);
    } else {
      applyTheme(stored || (prefersDark ? "dark" : "light"));
    }
  })();

  document.addEventListener("click", function (event) {
    var toggle = event.target.closest("[data-theme-toggle]");
    if (!toggle) return;
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    setStoredTheme(next);
  });

  /* ----------------------------------------------------- mobile nav */

  var mobileToggle = document.querySelector("[data-mobile-toggle]");
  var mobileNav = document.getElementById("mobile-nav");

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener("click", function () {
      var open = mobileToggle.getAttribute("aria-expanded") === "true";
      mobileToggle.setAttribute("aria-expanded", String(!open));
      mobileNav.classList.toggle("hidden", open);
      var iconOpen = mobileToggle.querySelector("[data-menu-open]");
      var iconClose = mobileToggle.querySelector("[data-menu-close]");
      if (iconOpen) iconOpen.classList.toggle("hidden", !open);
      if (iconClose) iconClose.classList.toggle("hidden", open);
    });
  }

  /* ------------------------------------------------------ dropdowns */

  var dropdowns = Array.prototype.slice.call(document.querySelectorAll("[data-dropdown]"));

  function closeDropdown(dropdown) {
    var trigger = dropdown.querySelector("[data-dropdown-trigger]");
    var panel = dropdown.querySelector("[data-dropdown-panel]");
    if (!trigger || !panel) return;
    trigger.setAttribute("aria-expanded", "false");
    panel.classList.add("invisible", "opacity-0");
    panel.classList.remove("translate-y-0");
    var chevron = trigger.querySelector("[data-chevron]");
    if (chevron) chevron.style.transform = "";
  }

  function openDropdown(dropdown) {
    var trigger = dropdown.querySelector("[data-dropdown-trigger]");
    var panel = dropdown.querySelector("[data-dropdown-panel]");
    if (!trigger || !panel) return;
    trigger.setAttribute("aria-expanded", "true");
    panel.classList.remove("invisible", "opacity-0");
    panel.classList.add("translate-y-0");
    var chevron = trigger.querySelector("[data-chevron]");
    if (chevron) chevron.style.transform = "rotate(180deg)";
  }

  dropdowns.forEach(function (dropdown) {
    var trigger = dropdown.querySelector("[data-dropdown-trigger]");
    var panel = dropdown.querySelector("[data-dropdown-panel]");
    if (!trigger || !panel) return;

    var timer = null;

    dropdown.addEventListener("mouseenter", function () {
      window.clearTimeout(timer);
      openDropdown(dropdown);
    });

    dropdown.addEventListener("mouseleave", function () {
      timer = window.setTimeout(function () {
        closeDropdown(dropdown);
      }, 140);
    });

    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      var isOpen = trigger.getAttribute("aria-expanded") === "true";
      dropdowns.forEach(closeDropdown);
      if (!isOpen) openDropdown(dropdown);
    });

    trigger.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        openDropdown(dropdown);
      }
    });
  });

  document.addEventListener("click", function () {
    dropdowns.forEach(closeDropdown);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") dropdowns.forEach(closeDropdown);
  });

  /* -------------------------------------------------- sticky header */

  var navBar = document.querySelector("[data-nav-bar]");
  if (navBar) {
    var onScroll = function () {
      if (window.scrollY > 8) {
        navBar.classList.add("shadow-[0_10px_30px_-18px_rgb(16_35_45/45%)]");
      } else {
        navBar.classList.remove("shadow-[0_10px_30px_-18px_rgb(16_35_45/45%)]");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------------------------------------------- scroll reveal */

  var revealItems = document.querySelectorAll(".reveal");
  if (revealItems.length) {
    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
      );
      revealItems.forEach(function (el, index) {
        el.style.transitionDelay = Math.min(index % 6, 5) * 70 + "ms";
        revealObserver.observe(el);
      });
    }
  }

  /* --------------------------------------------------------- counters */

  var counters = document.querySelectorAll("[data-count-to]");
  if (counters.length) {
    var animateCount = function (el) {
      var target = parseFloat(el.getAttribute("data-count-to"));
      var decimals = (el.getAttribute("data-count-decimals") || "0") | 0;
      var suffix = el.getAttribute("data-count-suffix") || "";
      var prefix = el.getAttribute("data-count-prefix") || "";

      var format = function (value) {
        if (decimals === 0) {
          return Math.round(value).toLocaleString("en-IN");
        }
        return value.toFixed(decimals);
      };

      if (reducedMotion) {
        el.textContent = prefix + format(target) + suffix;
        return;
      }
      var duration = 1400;
      var start = null;
      var step = function (timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = prefix + format(target * eased) + suffix;
        if (progress < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };

    if ("IntersectionObserver" in window) {
      var countObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              countObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach(function (el) {
        countObserver.observe(el);
      });
    } else {
      counters.forEach(animateCount);
    }
  }

  /* -------------------------------------------------------- accordions */

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-accordion-trigger]");
    if (!trigger) return;
    var item = trigger.closest("[data-accordion-item]");
    var panel = item ? item.querySelector("[data-accordion-panel]") : null;
    if (!item || !panel) return;

    var isOpen = item.classList.contains("is-open");

    document.querySelectorAll("[data-accordion-item].is-open").forEach(function (other) {
      if (other === item) return;
      other.classList.remove("is-open");
      var otherPanel = other.querySelector("[data-accordion-panel]");
      if (otherPanel) otherPanel.classList.add("hidden");
      var otherTrigger = other.querySelector("[data-accordion-trigger]");
      if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
    });

    item.classList.toggle("is-open", !isOpen);
    panel.classList.toggle("hidden", isOpen);
    trigger.setAttribute("aria-expanded", String(!isOpen));
  });

  /* ------------------------------------------------------------- tabs */

  document.addEventListener("click", function (event) {
    var tab = event.target.closest("[data-tab]");
    if (!tab) return;
    var group = tab.closest("[data-tabs]");
    if (!group) return;

    var name = tab.getAttribute("data-tab");
    group.querySelectorAll("[data-tab]").forEach(function (btn) {
      var isActive = btn === tab;
      btn.setAttribute("aria-selected", String(isActive));
      btn.classList.toggle("border-brand", isActive);
      btn.classList.toggle("text-heading", isActive);
      btn.classList.toggle("text-muted", !isActive);
      btn.classList.toggle("bg-surface-tint", isActive);
    });

    group.querySelectorAll("[data-tab-panel]").forEach(function (panel) {
      panel.classList.toggle("hidden", panel.getAttribute("data-tab-panel") !== name);
    });
  });

  /* ---------------------------------------------------------- forms */

  function showFormMessage(form, message, ok) {
    var target = form.querySelector("[data-form-message]");
    if (!target) return;
    target.textContent = message;
    target.classList.remove("hidden");
    target.classList.toggle("text-brand-deep", ok);
    target.classList.toggle("text-danger", !ok);
  }

  document.querySelectorAll("[data-newsletter]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var message = form.querySelector("[data-newsletter-message]");
      if (!input) return;
      var value = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        if (message) {
          message.textContent = "Please enter a valid email address.";
          message.classList.remove("hidden", "text-brand-deep");
          message.classList.add("text-danger");
        }
        return;
      }
      if (message) {
        message.textContent = "You're on the list. Look out for the next release note.";
        message.classList.remove("hidden", "text-danger");
        message.classList.add("text-brand-deep");
      }
      form.reset();
    });
  });

  document.querySelectorAll("[data-contact-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var required = Array.prototype.slice.call(form.querySelectorAll("[required]"));
      var invalid = required.filter(function (field) {
        return !String(field.value || "").trim();
      });
      required.forEach(function (field) {
        field.setAttribute(
          "aria-invalid",
          String(!String(field.value || "").trim())
        );
      });
      if (invalid.length) {
        showFormMessage(form, "Please complete the highlighted fields so we can route your enquiry.", false);
        invalid[0].focus();
        return;
      }
      showFormMessage(
        form,
        "Thank you - your enquiry has been received. A solutions consultant will respond within one business day.",
        true
      );
      form.reset();
    });
  });

  /* ------------------------------------------------------ ROI estimator */

  var roiPeople = document.getElementById("roi-people");
  var roiHours = document.getElementById("roi-hours");
  var roiCost = document.getElementById("roi-cost");

  if (roiPeople && roiHours && roiCost) {
    var roiHoursOut = document.querySelector("[data-roi-hours]");
    var roiValueOut = document.querySelector("[data-roi-value]");

    var formatBDT = function (value) {
      // Bangladeshi Taka, abbreviated the way amounts are written locally:
      // taka, then thousand (K), then lakh (L), then crore (Cr).
      if (value >= 10000000) return "৳" + (value / 10000000).toFixed(2) + " Cr";
      if (value >= 100000) return "৳" + (value / 100000).toFixed(2).replace(/\.?0+$/, "") + " L";
      if (value >= 1000) return "৳" + Math.round(value / 100) / 10 + "K";
      return "৳" + Math.round(value);
    };

    var formatNumber = function (value) {
      return Math.round(value).toLocaleString("en-IN");
    };

    var updateRoi = function () {
      var people = Math.max(0, parseFloat(roiPeople.value) || 0);
      var hours = Math.max(0, parseFloat(roiHours.value) || 0);
      var cost = Math.max(0, parseFloat(roiCost.value) || 0);

      var reclaimed = people * hours * 46 * 0.4;
      var value = reclaimed * cost;

      if (roiHoursOut) roiHoursOut.textContent = formatNumber(reclaimed) + " hrs";
      if (roiValueOut) roiValueOut.textContent = formatBDT(value);
    };

    [roiPeople, roiHours, roiCost].forEach(function (field) {
      field.addEventListener("input", updateRoi);
    });
    updateRoi();
  }

  /* ----------------------------------------------------------- misc */

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // Preselect a service in the contact form from ?service= / ?demo=1
  var params = new URLSearchParams(window.location.search);
  var contactForm = document.querySelector("[data-contact-form]");
  if (contactForm) {
    var serviceSelect = contactForm.querySelector('select[name="service"]');
    var service = params.get("service");
    if (serviceSelect && service) {
      var match = Array.prototype.slice
        .call(serviceSelect.options)
        .filter(function (option) {
          return option.value.toLowerCase() === service.toLowerCase();
        })[0];
      if (match) serviceSelect.value = match.value;
    }
    if (params.get("demo") === "1") {
      var subject = contactForm.querySelector('input[name="subject"]');
      if (subject && !subject.value) subject.value = "Product demo request";
      var message = contactForm.querySelector('textarea[name="message"]');
      if (message && !message.value) {
        message.value =
          "I would like a live demo of the ChronoCloud365 platform. Please share a time that suits our team.";
      }
    }
  }

  // Product filter chips on the products page
  document.querySelectorAll("[data-filter]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var value = chip.getAttribute("data-filter");
      document.querySelectorAll("[data-filter]").forEach(function (other) {
        var isActive = other === chip;
        other.classList.toggle("border-brand", isActive);
        other.classList.toggle("text-heading", isActive);
        other.classList.toggle("bg-brand-soft", isActive);
        other.classList.toggle("text-muted", !isActive);
      });
      document.querySelectorAll("[data-filter-item]").forEach(function (item) {
        var match = value === "all" || item.getAttribute("data-filter-item") === value;
        item.classList.toggle("hidden", !match);
      });
    });
  });
})();
