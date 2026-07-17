// Smooth scroll for in-page navigation
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const targetId = anchor.getAttribute("href");
    if (!targetId || targetId === "#") return;

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();

    const offset = 80; // header height
    const top =
      target.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top,
      behavior: "smooth",
    });
  });
});

// Active nav link on scroll
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute("id");
      if (!id) return;

      navLinks.forEach((link) => {
        link.classList.toggle(
          "is-active",
          link.getAttribute("href") === `#${id}`
        );
      });
    });
  },
  {
    root: null,
    threshold: 0.35,
  }
);

sections.forEach((section) => observer.observe(section));

// Mobile nav toggle
const nav = document.querySelector(".main-nav");
const toggle = document.querySelector(".nav-toggle");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  navLinks.forEach((link) =>
    link.addEventListener("click", () => {
      nav.classList.remove("open");
    })
  );
}

// Desktop dropdown in main nav
const dropdown = document.querySelector(".nav-dropdown");
const dropdownToggle = document.querySelector(".nav-dropdown-toggle");

if (dropdown && dropdownToggle) {
  dropdownToggle.addEventListener("click", () => {
    dropdown.classList.toggle("open");
  });

  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) {
      dropdown.classList.remove("open");
    }
  });
}

// Dynamic footer year
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear().toString();
}

// Expand hero image on click
const heroAccent = document.querySelector('.hero-accent');
if (heroAccent) {
  const lightbox = document.createElement('div');
  lightbox.className = 'hero-lightbox is-hidden';
  const image = document.createElement('img');
  image.src = 'images/hugging natrajar.JPG';
  image.alt = 'Nataraja image';
  lightbox.appendChild(image);
  document.body.appendChild(lightbox);

  heroAccent.addEventListener('click', () => {
    lightbox.classList.remove('is-hidden');
  });

  lightbox.addEventListener('click', () => {
    lightbox.classList.add('is-hidden');
  });
}

// Populate mudra detail illustration areas with an image holder and optional page-specific art
(function setupMudraIllustration() {
  const illustration = document.querySelector(".mudra-illustration");
  if (!illustration) return;

  const existingText = illustration.querySelector("span");
  let img = illustration.querySelector("img.mudra-image");
  const titleEl = document.querySelector("h1");
  const titleText = titleEl?.textContent?.trim() || "Mudra";
  const pageName = window.location.pathname
    .split("/")
    .pop()
    .replace(/\.html$/i, "") || "mudra";

  const candidates = new Set();
  const addCandidate = (value) => {
    if (!value) return;
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
    if (normalized) {
      candidates.add(normalized);
    }
  };

  addCandidate(pageName);
  addCandidate(titleText);

  const imageBase = new URL("../images/mudras/", window.location.href);
  const imageSources = [];

  candidates.forEach((candidate) => {
    [".jpg", ".png", ".jpeg", ".webp"].forEach((extension) => {
      imageSources.push(new URL(`${candidate}${extension}`, imageBase).toString());
    });
    const withoutSpaces = candidate.replace(/\s+/g, "");
    if (withoutSpaces !== candidate) {
      [".jpg", ".png", ".jpeg", ".webp"].forEach((extension) => {
        imageSources.push(new URL(`${withoutSpaces}${extension}`, imageBase).toString());
      });
    }
  });

  imageSources.push(new URL("placeholder.svg", imageBase).toString());

  if (!img) {
    img = document.createElement("img");
    img.alt = `${titleText} illustration`;
    img.loading = "eager";
    img.decoding = "async";
    img.className = "mudra-image";
    illustration.appendChild(img);
  } else {
    img.alt = `${titleText} illustration`;
    img.loading = "eager";
  }

  let index = 0;
  const tryNextImage = () => {
    if (index >= imageSources.length) {
      illustration.classList.add("is-loaded");
      if (existingText) {
        existingText.style.display = "none";
      }
      return;
    }

    const src = imageSources[index];
    index += 1;
    img.src = src;
  };

  img.addEventListener("load", () => {
    illustration.classList.add("is-loaded");
    if (existingText) {
      existingText.style.display = "none";
    }
  });

  img.addEventListener("error", () => {
    tryNextImage();
  });

  tryNextImage();
})();

(function relocateMudraCards() {
  const mudraSection = document.querySelector('.mudra-page-grid > div');
  const aside = document.querySelector('.mudra-detail-aside');
  if (!mudraSection || !aside) return;

  const cards = Array.from(aside.querySelectorAll('.mudra-card'));
  if (!cards.length) return;

  cards.forEach((card) => {
    mudraSection.appendChild(card);
  });
})();

(function linkRelatedMudras() {
  const slugify = (value) =>
    value
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[’'‘”"“]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  document.querySelectorAll('.mudra-card').forEach((card) => {
    const heading = card.querySelector('h3');
    if (!heading || heading.textContent.trim().toLowerCase() !== 'related mudras') return;

    const list = card.querySelector('ul');
    if (!list) return;

    list.querySelectorAll('li').forEach((li) => {
      if (li.querySelector('a')) return;
      const text = li.textContent.trim();
      if (!text) return;

      const anchor = document.createElement('a');
      anchor.href = `${slugify(text)}.html`;
      anchor.textContent = text;
      li.textContent = '';
      li.appendChild(anchor);
    });
  });
})();

// Replace remaining occurrences of the old site name with the new one
(function replaceSiteName() {
  const OLD = "Bharatanatyam 360";
  const NEW = "Neya Navarasa";

  // update document title
  if (document.title && document.title.includes(OLD)) {
    document.title = document.title.replace(OLD, NEW);
  }

  // update elements commonly used for the site name
  document.querySelectorAll('.brand-name, h1').forEach((el) => {
    if (el.textContent && el.textContent.includes(OLD)) {
      el.textContent = el.textContent.replace(OLD, NEW);
    }
  });

  // update any footer or other text nodes containing the old name
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (node.nodeValue && node.nodeValue.includes(OLD)) {
      node.nodeValue = node.nodeValue.replace(new RegExp(OLD, 'g'), NEW);
    }
  });
})();

(function setupImageViewer() {
  const openViewer = (src, alt) => {
    const viewer = document.createElement('div');
    viewer.className = 'image-viewer';

    const dialog = document.createElement('div');
    dialog.className = 'image-viewer__dialog';

    const image = document.createElement('img');
    image.className = 'image-viewer__img';
    image.src = src;
    image.alt = alt || '';

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'image-viewer__close';
    close.innerHTML = '&times;';

    const closeViewer = () => {
      viewer.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };

    close.addEventListener('click', closeViewer);

    viewer.addEventListener('click', (event) => {
      if (event.target === viewer) {
        closeViewer();
      }
    });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeViewer();
      }
    };

    dialog.appendChild(image);
    dialog.appendChild(close);
    viewer.appendChild(dialog);
    document.body.appendChild(viewer);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
  };

  document.querySelectorAll('img').forEach((img) => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      openViewer(img.src, img.alt);
    });
  });
})();


