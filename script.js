/* ==========================================================================
   Rendering for the content stored in the data files
   (news.js, publications.js, seminar.js, cv.js, teaching.js)
   ========================================================================== */

function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);

  if (options.className) {
    element.className = options.className;
  }

  if (options.text !== undefined) {
    element.textContent = options.text;
  }

  return element;
}

function setLink(anchor, url) {
  anchor.href = url;

  if (/^https?:\/\//i.test(url)) {
    anchor.target = "_blank";
    anchor.rel = "noopener";
  }
}

function formatPeriod(period) {
  return String(period || "").replace(/\s*-\s*/g, " – ");
}

function appendAuthorLine(container, authors) {
  const ownName = "Alan Pulval-Dady";
  const index = authors.indexOf(ownName);

  if (index === -1) {
    container.textContent = authors;
    return;
  }

  container.append(
    document.createTextNode(authors.slice(0, index)),
    createElement("strong", { text: ownName }),
    document.createTextNode(authors.slice(index + ownName.length))
  );
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

/* --------------------------------------------------------------------------
   News
   -------------------------------------------------------------------------- */

function renderNews() {
  const target = document.querySelector("#news-list");

  if (!target || !Array.isArray(window.NEWS)) {
    return;
  }

  const sortedNews = window.NEWS
    .slice()
    .sort((first, second) => new Date(second.date) - new Date(first.date));

  target.replaceChildren(...sortedNews.map((newsItem) => {
    const item = createElement("li");
    const time = createElement("time", { text: formatDate(newsItem.date) });
    const text = createElement("p");

    time.dateTime = newsItem.date;

    if (newsItem.link && newsItem.link.url) {
      const anchor = createElement("a", { text: newsItem.link.label });
      setLink(anchor, newsItem.link.url);
      text.append(anchor, ` ${newsItem.description || ""}`);
    } else {
      text.textContent = newsItem.description || "";
    }

    item.append(time, text);
    return item;
  }));
}

/* --------------------------------------------------------------------------
   Publications
   -------------------------------------------------------------------------- */

function renderPublications() {
  const target = document.querySelector("#publications-list");

  if (!target || !Array.isArray(window.PUBLICATIONS)) {
    return;
  }

  const groupedByYear = window.PUBLICATIONS
    .slice()
    .sort((first, second) => (second.year || 0) - (first.year || 0))
    .reduce((groups, publication) => {
      const year = publication.year || "Forthcoming";

      if (!groups.has(year)) {
        groups.set(year, []);
      }

      groups.get(year).push(publication);
      return groups;
    }, new Map());

  target.replaceChildren(...Array.from(groupedByYear, ([year, publications]) => {
    const section = createElement("section", { className: "publication-year" });
    const headingId = `pub-${String(year).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const heading = createElement("h3", { className: "pub-year", text: String(year) });
    const list = createElement("ol", { className: "pub-list" });

    section.setAttribute("aria-labelledby", headingId);
    heading.id = headingId;

    publications.forEach((publication) => {
      const item = createElement("li", { className: "pub-item" });
      const meta = createElement("div", { className: "pub-meta" });
      const title = createElement("h4", { className: "pub-title", text: publication.title });
      const authors = createElement("p", { className: "pub-authors" });
      const venue = createElement("p", { className: "pub-venue", text: publication.venue });

      if (publication.authors) {
        appendAuthorLine(authors, publication.authors);
      }

      if (publication.type) {
        meta.append(createElement("span", { className: "pub-type", text: publication.type }));
      }

      item.append(meta, title);

      if (publication.authors) {
        item.append(authors);
      }

      if (publication.venue) {
        item.append(venue);
      }

      if (Array.isArray(publication.links) && publication.links.length > 0) {
        const links = createElement("div", { className: "pub-links" });

        publication.links.forEach((link) => {
          const anchor = createElement("a", { text: link.label });
          setLink(anchor, link.url);

          if (/^https?:\/\//i.test(link.url)) {
            const arrow = createElement("span", { text: "↗" });
            arrow.setAttribute("aria-hidden", "true");
            anchor.append(arrow);
          }

          links.append(anchor);
        });

        item.append(links);
      }

      list.append(item);
    });

    section.append(heading, list);
    return section;
  }));
}

/* --------------------------------------------------------------------------
   CV
   -------------------------------------------------------------------------- */

function renderCV() {
  const target = document.querySelector("#cv-sections");

  if (!target || !Array.isArray(window.CV_SECTIONS)) {
    return;
  }

  target.replaceChildren(...window.CV_SECTIONS.map((group) => {
    const section = createElement("section", { className: "cv-section" });
    const heading = createElement("h3", { text: group.title });
    const list = createElement("ol", { className: "cv-items" });

    (group.items || []).forEach((entry) => {
      const item = createElement("li");
      const period = createElement("p", { className: "cv-period", text: formatPeriod(entry.period) });
      const content = createElement("div", { className: "cv-body" });
      const title = createElement("h4", { text: entry.title });

      content.append(title);

      if (entry.description) {
        content.append(createElement("p", { text: entry.description }));
      }

      item.append(period, content);
      list.append(item);
    });

    section.append(heading, list);
    return section;
  }));
}

/* --------------------------------------------------------------------------
   Teaching
   -------------------------------------------------------------------------- */

function renderTeaching() {
  const target = document.querySelector("#teaching-sections");

  if (!target || !Array.isArray(window.TEACHING)) {
    return;
  }

  target.replaceChildren(...window.TEACHING.map((group) => {
    const section = createElement("section", { className: "teaching-section" });
    const heading = createElement("h3", { text: group.title });
    const yearGroups = createElement("div", { className: "teaching-year-groups" });

    (group.years || []).forEach((yearGroup) => {
      const container = createElement("div", { className: "teaching-year-group" });
      const year = createElement("p", { className: "teaching-year", text: String(yearGroup.year) });
      const items = createElement("ul", { className: "teaching-items" });

      (yearGroup.items || []).forEach((entry) => {
        const item = createElement("li");

        if (entry.period) {
          item.append(createElement("span", { className: "teaching-period", text: formatPeriod(entry.period) }));
        } else {
          item.classList.add("is-simple");
        }

        item.append(createElement("span", { className: "teaching-title", text: entry.title }));
        items.append(item);
      });

      container.append(year, items);
      yearGroups.append(container);
    });

    section.append(heading, yearGroups);
    return section;
  }));
}

/* --------------------------------------------------------------------------
   Seminar
   -------------------------------------------------------------------------- */

function createEmptyTalkMessage(text) {
  return createElement("p", { className: "empty-state", text });
}

function createTalkDetails(talk) {
  const details = createElement("details", { className: "talk-item" });
  const summary = createElement("summary");
  const date = createElement("time", { className: "talk-date", text: formatDate(talk.date) });
  const summaryContent = createElement("span", { className: "talk-summary" });
  const summaryTitle = createElement("span", { className: "talk-title", text: talk.title });
  const speaker = createElement("span", { className: "talk-speaker", text: talk.speaker });
  const body = createElement("div", { className: "talk-description" });

  date.dateTime = talk.date;
  summaryContent.append(summaryTitle, speaker);
  summary.append(date, summaryContent);

  if (talk.affiliation) {
    body.append(createElement("p", { className: "talk-affiliation", text: talk.affiliation }));
  }

  body.append(createElement("p", { text: talk.description || "Description coming soon." }));

  if (talk.link) {
    const link = createElement("a", { text: "More information" });
    setLink(link, talk.link);
    body.append(link);
  }

  details.append(summary, body);
  return details;
}

function renderSeminarTalks() {
  const upcomingTarget = document.querySelector("#upcoming-talks");
  const pastTarget = document.querySelector("#past-talks");

  if (!upcomingTarget || !pastTarget || !Array.isArray(window.SEMINAR_TALKS)) {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const talks = window.SEMINAR_TALKS
    .slice()
    .filter((talk) => talk.date && talk.speaker && talk.title);

  const upcoming = talks
    .filter((talk) => new Date(`${talk.date}T00:00:00`) >= today)
    .sort((first, second) => new Date(first.date) - new Date(second.date));

  const past = talks
    .filter((talk) => new Date(`${talk.date}T00:00:00`) < today)
    .sort((first, second) => new Date(second.date) - new Date(first.date));

  upcomingTarget.replaceChildren(
    ...(upcoming.length
      ? upcoming.map(createTalkDetails)
      : [createEmptyTalkMessage("No upcoming talks scheduled yet.")])
  );

  pastTarget.replaceChildren(
    ...(past.length
      ? past.map(createTalkDetails)
      : [createEmptyTalkMessage("No past talks yet.")])
  );
}

function syncSeminarVisibility() {
  const section = document.querySelector("#seminar");
  const navLink = document.querySelector('.site-nav a[href="#seminar"]');

  if (!section) {
    return;
  }

  const hasTalks = Array.isArray(window.SEMINAR_TALKS)
    && window.SEMINAR_TALKS.some((talk) => talk.date && talk.speaker && talk.title);

  section.hidden = !hasTalks;

  if (navLink) {
    navLink.hidden = !hasTalks;
  }
}

function renumberSections() {
  const indexes = Array.from(document.querySelectorAll(".section .section-index"))
    .filter((element) => !element.closest("[hidden]"));

  indexes.forEach((element, index) => {
    element.textContent = String(index + 1).padStart(2, "0");
  });
}

/* --------------------------------------------------------------------------
   Navigation, active section, header state
   -------------------------------------------------------------------------- */

function setupNavigation() {
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("#site-nav");
  const toggle = document.querySelector(".nav-toggle");

  if (!header || !nav || !toggle) {
    return;
  }

  const closeNav = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      closeNav();
    }
  });

  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("is-open")) {
      return;
    }

    if (!nav.contains(event.target) && !toggle.contains(event.target)) {
      closeNav();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      closeNav();
      toggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) {
      closeNav();
    }
  });

  const navLinks = Array.from(nav.querySelectorAll('a[href^="#"]'))
    .filter((link) => !link.hidden);
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter((section) => section && !section.hidden);

  let frame = 0;

  const updateActiveLink = () => {
    frame = 0;
    header.classList.toggle("is-scrolled", window.scrollY > 8);

    if (sections.length === 0) {
      return;
    }

    const offset = header.offsetHeight + 32;
    let current = sections[0];

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= offset) {
        current = section;
      }
    });

    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

    if (atBottom) {
      current = sections[sections.length - 1];
    }

    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${current.id}`;
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const requestUpdate = () => {
    if (frame) {
      return;
    }

    frame = window.requestAnimationFrame(updateActiveLink);
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("hashchange", requestUpdate);
  updateActiveLink();
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */

renderNews();
renderPublications();
renderCV();
renderTeaching();
renderSeminarTalks();
syncSeminarVisibility();
renumberSections();
setupNavigation();
