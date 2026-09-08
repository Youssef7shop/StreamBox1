/* =========================================================
   STREAMBOX
   Vanilla JavaScript + Supabase
========================================================= */

/* =========================================================
   SUPABASE CONFIGURATION
=========================================================

   Replace these values with your Supabase project values.

   IMPORTANT:
   Use ONLY the publishable/anon client key here.

   NEVER put:
   - service_role key
   - secret key
   - database password
   - private credentials
========================================================= */

const SUPABASE_URL = "https://lxpjoemravgwlbllmabh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_G189DQuZqugIVHfZOYNvNw_tGr3LbNw";

const supabaseConfigured =
    SUPABASE_URL &&
    SUPABASE_PUBLISHABLE_KEY &&
    !SUPABASE_URL.includes("YOUR_") &&
    !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_");

const supabaseClient = supabaseConfigured
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    )
    : null;


/* =========================================================
   ACCESS CODE
========================================================= */

const ACCESS_CODE = "000000";

const ACCESS_STORAGE_KEY = "streambox_access_granted";


/* =========================================================
   APPLICATION STATE
========================================================= */

const state = {
    currentPage: "home",

    movies: [],
    series: [],
    seasons: [],
    episodes: [],

    categories: [],

    albums: [],
    music: [],

    radioStations: [],

    currentItem: null,

    isLoading: false,

    dataLoaded: false
};


/* =========================================================
   DOM REFERENCES
========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);


/* Access */
const accessScreen = $("#accessScreen");
const accessForm = $("#accessForm");
const accessCodeInput = $("#accessCode");
const accessError = $("#accessError");


/* Application */
const app = $("#app");
const mainContent = $("#mainContent");


/* Header */
const mobileMenuButton = $("#mobileMenuButton");
const mainNavigation = $("#mainNavigation");
const navLinks = $$(".nav-link");


/* Search */
const searchButton = $("#searchButton");
const searchPanel = $("#searchPanel");
const searchInput = $("#searchInput");
const closeSearchButton = $("#closeSearchButton");
const searchResults = $("#searchResults");


/* Home */
const heroSection = $("#heroSection");
const heroBackdropImage = $(".hero-backdrop-image");
const heroTitle = $("#heroTitle");
const heroDescription = $("#heroDescription");
const heroCategory = $("#heroCategory");
const heroYear = $("#heroYear");
const heroType = $("#heroType");
const heroRating = $("#heroRating");
const heroWatchButton = $("#heroWatchButton");
const heroInfoButton = $("#heroInfoButton");

const homeError = $("#homeError");

const featuredSection = $("#featuredSection");
const featuredGrid = $("#featuredGrid");

const moviesGrid = $("#moviesGrid");
const seriesGrid = $("#seriesGrid");
const kidsGrid = $("#kidsGrid");
const recentGrid = $("#recentGrid");


/* Catalog */
const catalogPage = $("#catalogPage");
const catalogTitle = $("#catalogTitle");
const catalogKicker = $("#catalogKicker");
const catalogDescription = $("#catalogDescription");
const catalogGrid = $("#catalogGrid");
const catalogError = $("#catalogError");


/* Music */
const musicPage = $("#musicPage");
const musicGrid = $("#musicGrid");
const musicError = $("#musicError");


/* Radio */
const radioPage = $("#radioPage");
const radioGrid = $("#radioGrid");
const radioError = $("#radioError");


/* Details */
const detailsModal = $("#detailsModal");
const detailsBackdrop = $("#detailsBackdrop");
const detailsType = $("#detailsType");
const detailsTitle = $("#detailsTitle");
const detailsYear = $("#detailsYear");
const detailsCategory = $("#detailsCategory");
const detailsRating = $("#detailsRating");
const detailsDescription = $("#detailsDescription");
const detailsWatchButton = $("#detailsWatchButton");


/* Video */
const videoModal = $("#videoModal");
const videoPlayer = $("#videoPlayer");
const videoTitle = $("#videoTitle");
const videoEmpty = $("#videoEmpty");


/* Audio */
const audioPlayerBar = $("#audioPlayerBar");
const audioCover = $("#audioCover");
const audioTitle = $("#audioTitle");
const audioArtist = $("#audioArtist");
const audioElement = $("#audioElement");
const audioPlayButton = $("#audioPlayButton");
const closeAudioButton = $("#closeAudioButton");


/* Radio player */
const radioPlayerBar = $("#radioPlayerBar");
const radioPlayerTitle = $("#radioPlayerTitle");
const radioAudioElement = $("#radioAudioElement");
const closeRadioButton = $("#closeRadioButton");


/* Misc */
const toast = $("#toast");
const currentYearElement = $("#currentYear");


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", init);

async function init() {

    currentYearElement.textContent = new Date().getFullYear();

    bindEvents();

    checkExistingAccess();
}


/* =========================================================
   ACCESS SYSTEM
========================================================= */

function normalizeCode(code) {
    return String(code || "")
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();
}


function verifyAccessCode(code) {
    return normalizeCode(code) === normalizeCode(ACCESS_CODE);
}


function checkExistingAccess() {

    const accessGranted =
        localStorage.getItem(ACCESS_STORAGE_KEY) === "true";

    if (accessGranted) {
        openApplication();
        return;
    }

    accessScreen.classList.remove("hidden");
    app.classList.add("hidden");

    setTimeout(() => {
        accessCodeInput?.focus();
    }, 100);
}


async function handleAccessSubmit(event) {

    event.preventDefault();

    const code = accessCodeInput.value;

    accessError.classList.add("hidden");

    if (!verifyAccessCode(code)) {

        accessError.textContent =
            "رمز الدخول غير صحيح. حاول مرة أخرى.";

        accessError.classList.remove("hidden");

        accessCodeInput.select();

        return;
    }

    localStorage.setItem(
        ACCESS_STORAGE_KEY,
        "true"
    );

    await openApplication();
}


async function openApplication() {

    /*
        IMPORTANT:

        The application opens BEFORE waiting for Supabase.
        This prevents a blank/black screen when the backend
        is slow or temporarily unavailable.
    */

    accessScreen.classList.add("hidden");

    app.classList.remove("hidden");

    renderPage("home");

    await loadData();

    renderPage("home");
}


/* =========================================================
   EVENT BINDING
========================================================= */

function bindEvents() {

    accessForm.addEventListener(
        "submit",
        handleAccessSubmit
    );


    /* Navigation */
    navLinks.forEach((button) => {

        button.addEventListener("click", () => {

            const page = button.dataset.page;

            navigateTo(page);

            mainNavigation.classList.remove("open");
        });
    });


    /* Brand */
    document.querySelectorAll("[data-page]").forEach((element) => {

        if (element.classList.contains("nav-link")) {
            return;
        }

        element.addEventListener("click", (event) => {

            const page = element.dataset.page;

            if (!page) {
                return;
            }

            event.preventDefault();

            navigateTo(page);
        });
    });


    /* Mobile menu */
    mobileMenuButton.addEventListener("click", () => {

        mainNavigation.classList.toggle("open");
    });


    /* Search */
    searchButton.addEventListener(
        "click",
        openSearch
    );

    closeSearchButton.addEventListener(
        "click",
        closeSearch
    );

    searchInput.addEventListener(
        "input",
        searchContent
    );


    /* Hero */
    heroWatchButton.addEventListener(
        "click",
        () => {

            if (!state.currentItem) {
                return;
            }

            openPlayer(state.currentItem);
        }
    );


    heroInfoButton.addEventListener(
        "click",
        () => {

            if (!state.currentItem) {
                return;
            }

            openDetails(state.currentItem);
        }
    );


    /* Details */
    detailsWatchButton.addEventListener(
        "click",
        () => {

            if (!state.currentItem) {
                return;
            }

            closeDetails();

            openPlayer(state.currentItem);
        }
    );


    /* Close modal */
    document.querySelectorAll("[data-close-modal]")
        .forEach((element) => {

            element.addEventListener(
                "click",
                closeDetails
            );
        });


    document.querySelectorAll("[data-close-video]")
        .forEach((element) => {

            element.addEventListener(
                "click",
                closeVideo
            );
        });


    /* Audio */
    audioPlayButton.addEventListener(
        "click",
        toggleAudio
    );

    closeAudioButton.addEventListener(
        "click",
        stopAudio
    );


    /* Radio */
    closeRadioButton.addEventListener(
        "click",
        stopRadio
    );


    /* Keyboard */
    document.addEventListener(
        "keydown",
        handleKeyboard
    );


    /* See all */
    document.querySelectorAll(".see-all-button")
        .forEach((button) => {

            button.addEventListener("click", () => {

                navigateTo(
                    button.dataset.page || "movies"
                );
            });
        });
}


/* =========================================================
   KEYBOARD
========================================================= */

function handleKeyboard(event) {

    if (event.key === "Escape") {

        closeSearch();
        closeDetails();
        closeVideo();
    }
}


/* =========================================================
   NAVIGATION
========================================================= */

function navigateTo(page) {

    state.currentPage = page;

    updateNavigation();

    renderPage(page);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function updateNavigation() {

    navLinks.forEach((link) => {

        link.classList.toggle(
            "active",
            link.dataset.page === state.currentPage
        );
    });
}


function renderPage(page) {

    document.querySelectorAll(".page")
        .forEach((element) => {

            element.classList.remove("active-page");
        });


    if (page === "home") {

        $("#homePage").classList.add("active-page");

        renderHome();

        return;
    }


    if (page === "movies") {

        catalogPage.classList.add("active-page");

        renderCatalog(
            "movies"
        );

        return;
    }


    if (page === "series") {

        catalogPage.classList.add("active-page");

        renderCatalog(
            "series"
        );

        return;
    }


    if (page === "kids") {

        catalogPage.classList.add("active-page");

        renderCatalog(
            "kids"
        );

        return;
    }


    if (page === "music") {

        musicPage.classList.add("active-page");

        renderMusic();

        return;
    }


    if (page === "radio") {

        radioPage.classList.add("active-page");

        renderRadio();

        return;
    }


    $("#homePage").classList.add("active-page");

    renderHome();
}


/* =========================================================
   SUPABASE DATA
========================================================= */

async function loadData() {

    state.isLoading = true;

    showHomeSkeletons();

    if (!supabaseClient) {

        state.isLoading = false;

        showGlobalConfigurationError();

        return;
    }


    try {

        const [
            categoriesResult,
            moviesResult,
            seriesResult,
            seasonsResult,
            episodesResult,
            albumsResult,
            musicResult,
            radioResult
        ] = await Promise.all([

            supabaseClient
                .from("categories")
                .select("*")
                .order("name", { ascending: true }),

            supabaseClient
                .from("movies")
                .select(`
                    *,
                    categories:category_id (
                        id,
                        name,
                        slug
                    )
                `)
                .eq("is_published", true)
                .order("created_at", { ascending: false }),

            supabaseClient
                .from("series")
                .select(`
                    *,
                    categories:category_id (
                        id,
                        name,
                        slug
                    )
                `)
                .eq("is_published", true)
                .order("created_at", { ascending: false }),

            supabaseClient
                .from("seasons")
                .select("*")
                .order("season_number", { ascending: true }),

            supabaseClient
                .from("episodes")
                .select("*")
                .eq("is_published", true)
                .order("episode_number", { ascending: true }),

            supabaseClient
                .from("albums")
                .select("*")
                .order("created_at", { ascending: false }),

            supabaseClient
                .from("music")
                .select(`
                    *,
                    albums:album_id (
                        id,
                        title,
                        artist
                    )
                `)
                .eq("is_published", true)
                .order("created_at", { ascending: false }),

            supabaseClient
                .from("radio_stations")
                .select("*")
                .eq("is_published", true)
                .order("created_at", { ascending: false })
        ]);


        const errors = [

            categoriesResult.error,
            moviesResult.error,
            seriesResult.error,
            seasonsResult.error,
            episodesResult.error,
            albumsResult.error,
            musicResult.error,
            radioResult.error

        ].filter(Boolean);


        if (errors.length > 0) {

            console.error(
                "Supabase data loading error:",
                errors
            );

            throw errors[0];
        }


        state.categories =
            categoriesResult.data || [];

        state.movies =
            moviesResult.data || [];

        state.series =
            seriesResult.data || [];

        state.seasons =
            seasonsResult.data || [];

        state.episodes =
            episodesResult.data || [];

        state.albums =
            albumsResult.data || [];

        state.music =
            musicResult.data || [];

        state.radioStations =
            radioResult.data || [];


        state.dataLoaded = true;

        state.isLoading = false;


        hideConfigurationError();

        showToast("تم تحميل المحتوى بنجاح.");


    } catch (error) {

        console.error(
            "Unable to load StreamBox content:",
            error
        );

        state.isLoading = false;

        showDatabaseError();
    }
}


/* =========================================================
   CONFIGURATION / DATABASE ERRORS
========================================================= */

function showGlobalConfigurationError() {

    const message = `
        <div class="error-state">
            <h3>Supabase غير مهيأ بعد</h3>
            <p>
                أضف SUPABASE_URL و
                SUPABASE_PUBLISHABLE_KEY في app.js
                لربط الموقع بقاعدة البيانات.
            </p>
        </div>
    `;

    homeError.innerHTML = message;

    homeError.classList.remove("hidden");
}


function hideConfigurationError() {

    homeError.classList.add("hidden");
}


function showDatabaseError() {

    homeError.innerHTML = `
        <h3>Unable to load content.</h3>
        <p>
            Please check your connection and try again.
        </p>
    `;

    homeError.classList.remove("hidden");
}


/* =========================================================
   HOME
========================================================= */

function renderHome() {

    if (!state.dataLoaded) {

        if (state.isLoading) {
            showHomeSkeletons();
        }

        return;
    }


    hideConfigurationError();

    const featured = getFeaturedContent();

    renderHero(featured);

    renderFeatured(featured);

    renderMediaGrid(
        moviesGrid,
        state.movies.slice(0, 10)
    );

    renderMediaGrid(
        seriesGrid,
        state.series.slice(0, 10)
    );

    renderMediaGrid(
        kidsGrid,
        getKidsContent().slice(0, 10)
    );

    renderMediaGrid(
        recentGrid,
        getRecentContent().slice(0, 10)
    );
}


/* =========================================================
   HERO
========================================================= */

function getFeaturedContent() {

    const movie = state.movies.find(
        (item) => item.is_featured
    );

    if (movie) {
        return movie;
    }


    const series = state.series.find(
        (item) => item.is_featured
    );

    if (series) {
        return series;
    }


    return state.movies[0]
        || state.series[0]
        || null;
}


function renderHero(item) {

    if (!item) {

        state.currentItem = null;

        heroTitle.textContent =
            "StreamBox";

        heroDescription.textContent =
            "استمتع بالمحتوى المفضل لديك في مكان واحد.";

        heroCategory.textContent =
            "STREAMBOX";

        heroYear.textContent =
            new Date().getFullYear();

        heroType.textContent =
            "Entertainment";

        heroRating.textContent =
            "—";

        heroBackdropImage.style.backgroundImage =
            "none";

        heroWatchButton.disabled = true;
        heroInfoButton.disabled = true;

        return;
    }


    state.currentItem = item;

    heroWatchButton.disabled = false;
    heroInfoButton.disabled = false;


    heroTitle.textContent =
        item.title || "Untitled";


    heroDescription.textContent =
        item.description ||
        "لا يوجد وصف متوفر لهذا المحتوى.";


    heroCategory.textContent =
        getCategoryName(item) ||
        "STREAMBOX";


    heroYear.textContent =
        item.release_year || "—";


    heroType.textContent =
        item.video_url
            ? "Movie"
            : "Series";


    heroRating.textContent =
        formatRating(item.rating);


    const backdrop =
        item.backdrop_url ||
        item.poster_url;


    if (backdrop) {

        heroBackdropImage.style.backgroundImage =
            `url("${escapeCssUrl(backdrop)}")`;

    } else {

        heroBackdropImage.style.backgroundImage =
            "none";
    }
}


/* =========================================================
   FEATURED
========================================================= */

function renderFeatured(featured) {

    const items = getFeaturedItems();

    if (!items.length) {

        featuredSection.classList.add("hidden");

        return;
    }


    featuredSection.classList.remove("hidden");

    renderMediaGrid(
        featuredGrid,
        items
    );
}


function getFeaturedItems() {

    return [

        ...state.movies.filter(
            (item) => item.is_featured
        ),

        ...state.series.filter(
            (item) => item.is_featured
        )

    ].slice(0, 10);
}


/* =========================================================
   CATALOG
========================================================= */

function renderCatalog(type) {

    if (!state.dataLoaded) {

        renderCatalogSkeletons();

        return;
    }


    let items = [];

    if (type === "movies") {

        catalogKicker.textContent = "MOVIES";

        catalogTitle.textContent = "الأفلام";

        catalogDescription.textContent =
            "اكتشف الأفلام المنشورة على StreamBox.";

        items = state.movies;
    }


    if (type === "series") {

        catalogKicker.textContent = "SERIES";

        catalogTitle.textContent =
            "مسلسلات ودراما";

        catalogDescription.textContent =
            "شاهد المسلسلات والمواسم والحلقات المتاحة.";

        items = state.series;
    }


    if (type === "kids") {

        catalogKicker.textContent = "KIDS";

        catalogTitle.textContent =
            "للأطفال";

        catalogDescription.textContent =
            "محتوى مخصص لقسم الأطفال.";

        items = getKidsContent();
    }


    catalogError.classList.add("hidden");

    renderMediaGrid(
        catalogGrid,
        items
    );
}


/* =========================================================
   KIDS
========================================================= */

function getKidsContent() {

    const kidsCategoryIds =
        new Set(

            state.categories
                .filter((category) => {

                    const name =
                        String(category.name || "")
                            .toLowerCase();

                    const slug =
                        String(category.slug || "")
                            .toLowerCase();

                    return (
                        name.includes("kid") ||
                        name.includes("طفل") ||
                        slug.includes("kid") ||
                        slug.includes("kids")
                    );
                })
                .map((category) => category.id)
        );


    return [

        ...state.movies.filter(
            (movie) =>
                kidsCategoryIds.has(movie.category_id)
        ),

        ...state.series.filter(
            (series) =>
                kidsCategoryIds.has(series.category_id)
        )

    ];
}


/* =========================================================
   RECENT CONTENT
========================================================= */

function getRecentContent() {

    return [

        ...state.movies,

        ...state.series

    ]
        .sort((a, b) => {

            return new Date(
                b.created_at || 0
            ) - new Date(
                a.created_at || 0
            );
        });
}


/* =========================================================
   MEDIA CARDS
========================================================= */

function renderMediaGrid(container, items) {

    if (!container) {
        return;
    }


    if (!items || items.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>لا يوجد محتوى حاليا</h3>
                <p>
                    سيتم عرض المحتوى هنا عند إضافته من لوحة الإدارة.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        items.map(createMediaCard).join("");


    container
        .querySelectorAll("[data-item-type]")
        .forEach((card) => {

            card.addEventListener(
                "click",
                () => {

                    const type =
                        card.dataset.itemType;

                    const id =
                        card.dataset.itemId;

                    const item =
                        findContentItem(
                            type,
                            id
                        );

                    if (item) {
                        openDetails(item);
                    }
                }
            );
        });
}


function createMediaCard(item) {

    const type =
        getContentType(item);

    const image =
        item.poster_url ||
        item.thumbnail_url ||
        "";


    const safeTitle =
        escapeHtml(
            item.title || "Untitled"
        );


    const category =
        escapeHtml(
            getCategoryName(item) || "—"
        );


    const year =
        item.release_year || "—";


    const rating =
        formatRating(item.rating);


    return `
        <article
            class="media-card"
            data-item-type="${type}"
            data-item-id="${escapeHtml(String(item.id))}"
        >

            <div class="media-card-image">

                ${
                    image
                        ? `
                            <img
                                src="${escapeHtml(image)}"
                                alt="${safeTitle}"
                                loading="lazy"
                                onerror="this.style.display='none'"
                            >
                        `
                        : `
                            <div class="media-image-fallback">
                                StreamBox
                            </div>
                        `
                }

                <div class="media-card-overlay">
                    <span class="play-circle">▶</span>
                </div>

                ${
                    item.is_featured
                        ? `
                            <span class="media-card-badge">
                                مميز
                            </span>
                        `
                        : ""
                }

            </div>

            <div class="media-card-info">

                <h3 class="media-card-title">
                    ${safeTitle}
                </h3>

                <div class="media-card-meta">
                    <span>${year}</span>
                    <span>•</span>
                    <span>${category}</span>
                    <span>•</span>
                    <span>${rating}</span>
                </div>

            </div>

        </article>
    `;
}


/* =========================================================
   CONTENT HELPERS
========================================================= */

function getContentType(item) {

    if (state.movies.some(
        (movie) => String(movie.id) === String(item.id)
    )) {
        return "movie";
    }


    if (state.series.some(
        (series) => String(series.id) === String(item.id)
    )) {
        return "series";
    }


    return "unknown";
}


function findContentItem(type, id) {

    if (type === "movie") {

        return state.movies.find(
            (item) =>
                String(item.id) === String(id)
        ) || null;
    }


    if (type === "series") {

        return state.series.find(
            (item) =>
                String(item.id) === String(id)
        ) || null;
    }


    return null;
}


function getCategoryName(item) {

    if (item.categories?.name) {

        return item.categories.name;
    }


    const category =
        state.categories.find(
            (category) =>
                String(category.id) ===
                String(item.category_id)
        );


    return category?.name || "";
}


function formatRating(rating) {

    if (
        rating === null ||
        rating === undefined ||
        rating === ""
    ) {
        return "—";
    }


    const number =
        Number(rating);


    if (Number.isNaN(number)) {
        return String(rating);
    }


    return number.toFixed(1);
}


/* =========================================================
   DETAILS
========================================================= */

function openDetails(item) {

    if (!item) {
        return;
    }


    state.currentItem = item;


    detailsType.textContent =
        getContentType(item).toUpperCase();


    detailsTitle.textContent =
        item.title || "Untitled";


    detailsYear.textContent =
        item.release_year || "—";


    detailsCategory.textContent =
        getCategoryName(item) || "—";


    detailsRating.textContent =
        formatRating(item.rating);


    detailsDescription.textContent =
        item.description ||
        "لا يوجد وصف متوفر لهذا المحتوى.";


    const backdrop =
        item.backdrop_url ||
        item.poster_url;


    if (backdrop) {

        detailsBackdrop.style.backgroundImage =
            `url("${escapeCssUrl(backdrop)}")`;

    } else {

        detailsBackdrop.style.backgroundImage =
            "none";
    }


    detailsModal.classList.remove("hidden");

    detailsModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow = "hidden";
}


function closeDetails() {

    detailsModal.classList.add("hidden");

    detailsModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow = "";
}


/* =========================================================
   VIDEO PLAYER
========================================================= */

function openPlayer(item) {

    if (!item) {
        return;
    }


    videoTitle.textContent =
        item.title || "StreamBox";


    const videoUrl =
        item.video_url;


    if (!videoUrl) {

        videoPlayer.pause();

        videoPlayer.removeAttribute("src");

        videoPlayer.load();

        videoEmpty.classList.remove("hidden");

    } else {

        videoEmpty.classList.add("hidden");

        videoPlayer.src = videoUrl;

        videoPlayer.load();

        /*
            Autoplay is attempted.
            Browser policy may prevent it.
        */

        videoPlayer.play().catch(() => {});
    }


    videoModal.classList.remove("hidden");

    videoModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow = "hidden";
}


function closeVideo() {

    if (videoModal.classList.contains("hidden")) {
        return;
    }


    videoPlayer.pause();

    videoPlayer.removeAttribute("src");

    videoPlayer.load();


    videoModal.classList.add("hidden");

    videoModal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.style.overflow = "";
}


/* =========================================================
   MUSIC
========================================================= */

function renderMusic() {

    if (!state.dataLoaded) {

        renderMusicSkeletons();

        return;
    }


    musicError.classList.add("hidden");


    if (!state.music.length) {

        musicGrid.innerHTML = `
            <div class="empty-state">
                <h3>لا توجد موسيقى حاليا</h3>
                <p>
                    أضف الأغاني من لوحة الإدارة.
                </p>
            </div>
        `;

        return;
    }


    musicGrid.innerHTML =
        state.music
            .map(createMusicCard)
            .join("");


    musicGrid
        .querySelectorAll("[data-music-id]")
        .forEach((card) => {

            card.addEventListener(
                "click",
                () => {

                    const id =
                        card.dataset.musicId;

                    const music =
                        state.music.find(
                            (item) =>
                                String(item.id) ===
                                String(id)
                        );

                    if (music) {
                        openAudioPlayer(music);
                    }
                }
            );
        });
}


function createMusicCard(item) {

    const album =
        item.albums;


    const artist =
        item.artist ||
        album?.artist ||
        "Unknown Artist";


    const cover =
        item.cover_url ||
        album?.cover_url ||
        "";


    return `
        <article
            class="music-card"
            data-music-id="${escapeHtml(String(item.id))}"
        >

            <div class="music-cover">

                ${
                    cover
                        ? `
                            <img
                                src="${escapeHtml(cover)}"
                                alt="${escapeHtml(item.title || "Cover")}"
                                loading="lazy"
                                onerror="this.style.display='none'"
                            >
                        `
                        : "♪"
                }

            </div>

            <div class="music-info">

                <h3>
                    ${escapeHtml(item.title || "Untitled")}
                </h3>

                <p>
                    ${escapeHtml(artist)}
                    ${
                        album?.title
                            ? ` • ${escapeHtml(album.title)}`
                            : ""
                    }
                </p>

            </div>

            <button
                class="music-play"
                type="button"
                aria-label="تشغيل"
            >
                ▶
            </button>

        </article>
    `;
}


function openAudioPlayer(item) {

    if (!item) {
        return;
    }


    if (!item.audio_url) {

        showToast(
            "لا يوجد رابط صوت لهذا المقطع."
        );

        return;
    }


    const album =
        item.albums;


    const artist =
        item.artist ||
        album?.artist ||
        "Unknown Artist";


    audioTitle.textContent =
        item.title || "Untitled";


    audioArtist.textContent =
        artist;


    const cover =
        item.cover_url ||
        album?.cover_url;


    if (cover) {

        audioCover.innerHTML =
            `<img src="${escapeHtml(cover)}" alt="">`;

    } else {

        audioCover.textContent = "♪";
    }


    audioElement.src =
        item.audio_url;


    audioPlayerBar.classList.remove("hidden");


    audioElement.play()
        .then(() => {

            audioPlayButton.textContent =
                "❚❚";

        })
        .catch(() => {

            audioPlayButton.textContent =
                "▶";
        });
}


function toggleAudio() {

    if (!audioElement.src) {
        return;
    }


    if (audioElement.paused) {

        audioElement.play()
            .then(() => {

                audioPlayButton.textContent =
                    "❚❚";
            });

    } else {

        audioElement.pause();

        audioPlayButton.textContent =
            "▶";
    }
}


function stopAudio() {

    audioElement.pause();

    audioElement.removeAttribute("src");

    audioElement.load();

    audioPlayerBar.classList.add("hidden");

    audioPlayButton.textContent =
        "▶";
}


audioElement.addEventListener(
    "play",
    () => {
        audioPlayButton.textContent = "❚❚";
    }
);


audioElement.addEventListener(
    "pause",
    () => {
        audioPlayButton.textContent = "▶";
    }
);


/* =========================================================
   RADIO
========================================================= */

function renderRadio() {

    if (!state.dataLoaded) {

        renderRadioSkeletons();

        return;
    }


    radioError.classList.add("hidden");


    if (!state.radioStations.length) {

        radioGrid.innerHTML = `
            <div class="empty-state">
                <h3>لا توجد محطات حاليا</h3>
                <p>
                    أضف محطات الراديو من لوحة الإدارة.
                </p>
            </div>
        `;

        return;
    }


    radioGrid.innerHTML =
        state.radioStations
            .map(createRadioCard)
            .join("");


    radioGrid
        .querySelectorAll("[data-radio-id]")
        .forEach((card) => {

            card.addEventListener(
                "click",
                () => {

                    const id =
                        card.dataset.radioId;

                    const station =
                        state.radioStations.find(
                            (item) =>
                                String(item.id) ===
                                String(id)
                        );

                    if (station) {
                        openRadioPlayer(station);
                    }
                }
            );
        });
}


function createRadioCard(station) {

    const logo =
        station.logo_url || "";


    const isLive =
        Boolean(station.is_live);


    return `
        <article
            class="radio-card"
            data-radio-id="${escapeHtml(String(station.id))}"
        >

            <div class="radio-top">

                <div class="radio-logo">

                    ${
                        logo
                            ? `
                                <img
                                    src="${escapeHtml(logo)}"
                                    alt="${escapeHtml(station.name || "Radio")}"
                                    loading="lazy"
                                >
                            `
                            : "RADIO"
                    }

                </div>

                <div>

                    <h3>
                        ${escapeHtml(
                            station.name || "Radio Station"
                        )}
                    </h3>

                    <span
                        class="live-status ${
                            isLive ? "live" : ""
                        }"
                    >
                        <span class="live-dot"></span>

                        ${
                            isLive
                                ? "LIVE الآن"
                                : "OFFLINE"
                        }

                    </span>

                </div>

            </div>

            <p>
                ${escapeHtml(
                    station.description ||
                    "لا يوجد وصف متوفر."
                )}
            </p>

            <button
                class="primary-button"
                type="button"
            >
                ▶ استماع
            </button>

        </article>
    `;
}


function openRadioPlayer(station) {

    if (!station.stream_url) {

        showToast(
            "لا يوجد رابط بث لهذه المحطة."
        );

        return;
    }


    radioPlayerTitle.textContent =
        station.name || "Radio";


    radioAudioElement.src =
        station.stream_url;


    radioPlayerBar.classList.remove(
        "hidden"
    );


    radioAudioElement.play()
        .catch(() => {

            showToast(
                "اضغط تشغيل لبدء بث الراديو."
            );
        });
}


function stopRadio() {

    radioAudioElement.pause();

    radioAudioElement.removeAttribute(
        "src"
    );

    radioAudioElement.load();

    radioPlayerBar.classList.add(
        "hidden"
    );
}


/* =========================================================
   SEARCH
========================================================= */

function openSearch() {

    searchPanel.classList.remove("hidden");

    setTimeout(() => {
        searchInput.focus();
    }, 50);
}


function closeSearch() {

    searchPanel.classList.add("hidden");

    searchInput.value = "";

    searchResults.innerHTML = "";
}


function searchContent() {

    const query =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!query) {

        searchResults.innerHTML = "";

        return;
    }


    const allContent = [

        ...state.movies.map((item) => ({
            ...item,
            _type: "movie"
        })),

        ...state.series.map((item) => ({
            ...item,
            _type: "series"
        }))

    ];


    const results =
        allContent.filter((item) => {

            const title =
                String(item.title || "")
                    .toLowerCase();

            const description =
                String(item.description || "")
                    .toLowerCase();

            const category =
                String(getCategoryName(item) || "")
                    .toLowerCase();

            return (
                title.includes(query) ||
                description.includes(query) ||
                category.includes(query)
            );
        });


    if (!results.length) {

        searchResults.innerHTML = `
            <div class="empty-state">
                <h3>No results found.</h3>
                <p>
                    لم نجد أي محتوى مطابق لبحثك.
                </p>
            </div>
        `;

        return;
    }


    searchResults.innerHTML =
        results
            .slice(0, 20)
            .map(createSearchResult)
            .join("");


    searchResults
        .querySelectorAll("[data-search-type]")
        .forEach((element) => {

            element.addEventListener(
                "click",
                () => {

                    const type =
                        element.dataset.searchType;

                    const id =
                        element.dataset.searchId;

                    const item =
                        findContentItem(
                            type,
                            id
                        );

                    if (item) {

                        closeSearch();

                        openDetails(item);
                    }
                }
            );
        });
}


function createSearchResult(item) {

    const image =
        item.poster_url ||
        "";


    return `
        <div
            class="search-result"
            data-search-type="${item._type}"
            data-search-id="${escapeHtml(String(item.id))}"
        >

            <div class="search-result-image">

                ${
                    image
                        ? `
                            <img
                                src="${escapeHtml(image)}"
                                alt=""
                            >
                        `
                        : ""
                }

            </div>

            <div>

                <div class="search-result-title">
                    ${escapeHtml(
                        item.title || "Untitled"
                    )}
                </div>

                <div class="search-result-meta">

                    ${
                        item.release_year || "—"
                    }

                    •
                    ${
                        escapeHtml(
                            getCategoryName(item) || "—"
                        )
                    }

                </div>

            </div>

        </div>
    `;
}


/* =========================================================
   LOADING SKELETONS
========================================================= */

function createSkeletonCards(count = 5) {

    return Array.from({
        length: count
    })
        .map(() => `
            <div class="skeleton-card">

                <div class="skeleton-image"></div>

                <div class="skeleton-info">

                    <div class="skeleton-line"></div>

                    <div class="skeleton-line short"></div>

                </div>

            </div>
        `)
        .join("");
}


function showHomeSkeletons() {

    moviesGrid.innerHTML =
        createSkeletonCards();

    seriesGrid.innerHTML =
        createSkeletonCards();

    kidsGrid.innerHTML =
        createSkeletonCards();

    recentGrid.innerHTML =
        createSkeletonCards();

    featuredGrid.innerHTML =
        createSkeletonCards();

    featuredSection.classList.remove(
        "hidden"
    );
}


function renderCatalogSkeletons() {

    catalogGrid.innerHTML =
        createSkeletonCards(10);
}


function renderMusicSkeletons() {

    musicGrid.innerHTML =
        Array.from({ length: 6 })
            .map(() => `
                <div class="music-card">

                    <div class="music-cover"></div>

                    <div class="music-info">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                    </div>

                </div>
            `)
            .join("");
}


function renderRadioSkeletons() {

    radioGrid.innerHTML =
        Array.from({ length: 3 })
            .map(() => `
                <div class="radio-card">

                    <div class="radio-top">

                        <div class="radio-logo"></div>

                        <div>
                            <div class="skeleton-line"></div>
                            <div class="skeleton-line short"></div>
                        </div>

                    </div>

                </div>
            `)
            .join("");
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function showToast(message) {

    clearTimeout(toastTimer);

    toast.textContent =
        message;


    toast.classList.add("show");


    toastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 3000);
}


/* =========================================================
   SECURITY / OUTPUT HELPERS
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeCssUrl(value) {

    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "")
        .replace(/\r/g, "");
}


/* =========================================================
   GLOBAL ERROR SAFETY
========================================================= */

window.addEventListener(
    "error",
    (event) => {

        console.error(
            "StreamBox runtime error:",
            event.error || event.message
        );
    }
);


window.addEventListener(
    "unhandledrejection",
    (event) => {

        console.error(
            "StreamBox promise error:",
            event.reason
        );
    }
);
