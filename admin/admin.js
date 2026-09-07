/* =========================================================
   STREAMBOX ADMIN - COMPLETE admin.js
   ========================================================= */

const SUPABASE_URL = "https://lxpjoemravgwlbllmabh.supabase.co";
const SUPABASE_ANON_KEY =
    "sb_publishable_G189DQuZqugIVHfZOYNvNw_tGr3LbNw";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

/* =========================================================
   HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);

function escapeHTML(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function slugify(value = "") {
    return value
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function toast(message, type = "success") {
    const box = $("toast");
    const text = $("toastMessage");

    if (!box || !text) {
        console.log(message);
        return;
    }

    text.textContent = message;

    box.classList.remove("show", "success", "error", "warning");
    box.classList.add(type);
    box.classList.add("show");

    clearTimeout(window.__toastTimer);

    window.__toastTimer = setTimeout(() => {
        box.classList.remove("show");
    }, 3000);
}

function message(id, text = "", type = "error") {
    const el = $(id);
    if (!el) return;

    el.textContent = text;

    if (!text) {
        el.classList.add("hidden");
        return;
    }

    el.classList.remove("hidden");
    el.classList.remove("error", "success");
    el.classList.add(type);
}

/* =========================================================
   ADMIN AUTH
   ========================================================= */

async function isAdmin(user) {
    if (!user?.id) return false;

    const { data, error } = await supabaseClient
        .from("admin_profiles")
        .select("id,user_id,role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

    if (error) {
        console.error("Admin check error:", error);
        return false;
    }

    return !!data;
}

async function getSessionUser() {
    const { data, error } =
        await supabaseClient.auth.getSession();

    if (error) {
        console.error(error);
        return null;
    }

    return data?.session?.user || null;
}

/* =========================================================
   LOGIN
   ========================================================= */

function initLogin() {
    const form = $("adminLoginForm");

    if (!form) return;

    const email = $("adminEmail");
    const password = $("adminPassword");

    const button = $("loginButton");
    const buttonText = $("loginButtonText");
    const spinner = $("loginSpinner");

    const errorBox = $("loginError");
    const successBox = $("loginSuccess");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        errorBox?.classList.add("hidden");
        successBox?.classList.add("hidden");

        const emailValue = email?.value.trim();
        const passwordValue = password?.value;

        if (!emailValue) {
            if (errorBox) {
                errorBox.textContent = "Enter your email.";
                errorBox.classList.remove("hidden");
            }
            return;
        }

        if (!passwordValue) {
            if (errorBox) {
                errorBox.textContent = "Enter your password.";
                errorBox.classList.remove("hidden");
            }
            return;
        }

        if (button) button.disabled = true;
        if (spinner) spinner.classList.remove("hidden");
        if (buttonText) buttonText.textContent = "Signing in...";

        try {
            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email: emailValue,
                    password: passwordValue
                });

            if (error) throw error;

            const user = data?.user;

            if (!user) {
                throw new Error("Login failed.");
            }

            const admin = await isAdmin(user);

            if (!admin) {
                await supabaseClient.auth.signOut();
                throw new Error(
                    "This account is not an administrator."
                );
            }

            if (successBox) {
                successBox.textContent =
                    "Login successful. Redirecting...";
                successBox.classList.remove("hidden");
            }

            setTimeout(() => {
                window.location.href = "index.html";
            }, 400);

        } catch (error) {
            console.error(error);

            if (errorBox) {
                errorBox.textContent =
                    error.message ||
                    "Invalid email or password.";
                errorBox.classList.remove("hidden");
            }

        } finally {
            if (button) button.disabled = false;
            if (spinner) spinner.classList.add("hidden");
            if (buttonText) buttonText.textContent = "Sign In";
        }
    });
}

/* =========================================================
   DASHBOARD AUTH
   ========================================================= */

async function protectDashboard() {
    if (!$("adminApp")) return null;

    const user = await getSessionUser();

    if (!user) {
        window.location.replace("login.html");
        return null;
    }

    const admin = await isAdmin(user);

    if (!admin) {
        await supabaseClient.auth.signOut();
        window.location.replace("login.html");
        return null;
    }

    return user;
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function initNavigation() {
    document
        .querySelectorAll(".nav-item[data-section]")
        .forEach((button) => {

            button.addEventListener("click", () => {
                const section = button.dataset.section;

                document
                    .querySelectorAll(".nav-item")
                    .forEach((item) =>
                        item.classList.remove("active")
                    );

                button.classList.add("active");

                document
                    .querySelectorAll(".admin-section")
                    .forEach((sectionElement) =>
                        sectionElement.classList.remove("active")
                    );

                const target =
                    $(`section-${section}`);

                if (target) {
                    target.classList.add("active");
                }

                if ($("pageTitle")) {
                    const titles = {
                        overview: "Overview",
                        content: "Content",
                        categories: "Categories",
                        users: "Users",
                        settings: "Settings"
                    };

                    $("pageTitle").textContent =
                        titles[section] || "Overview";
                }
            });
        });

    document
        .querySelectorAll("[data-section-target]")
        .forEach((button) => {

            button.addEventListener("click", () => {
                const section =
                    button.dataset.sectionTarget;

                const nav =
                    document.querySelector(
                        `.nav-item[data-section="${section}"]`
                    );

                nav?.click();
            });
        });
}

/* =========================================================
   DATA
   ========================================================= */

let categories = [];
let content = [];

/* =========================================================
   CATEGORIES
   ========================================================= */

async function loadCategories() {

    const { data, error } = await supabaseClient
        .from("categories")
        .select("*")
        .order("name", {
            ascending: true
        });

    if (error) {
        console.error(error);
        categories = [];
        return;
    }

    categories = data || [];

    renderCategories();
    fillCategorySelect();
}

function fillCategorySelect() {

    const select = $("contentCategory");

    if (!select) return;

    select.innerHTML = `
        <option value="">Select category</option>

        ${categories.map(category => `
            <option value="${escapeHTML(category.id)}">
                ${escapeHTML(category.name)}
            </option>
        `).join("")}
    `;
}

function renderCategories() {

    const container =
        $("categoriesGrid");

    if (!container) return;

    if (!categories.length) {

        container.innerHTML = `
            <div class="empty-state">
                <span>▦</span>
                <p>No categories yet.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        categories.map(category => {

            const count =
                content.filter(
                    item =>
                        item.category_id ===
                        category.id
                ).length;

            return `
                <div class="category-card">

                    <div class="category-card-header">
                        <h3>
                            ${escapeHTML(category.name)}
                        </h3>
                    </div>

                    <p class="category-count">
                        ${count} content
                    </p>

                    <div class="category-actions">

                        <button
                            type="button"
                            class="secondary-button"
                            data-delete-category="${category.id}"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `;

        }).join("");

    container
        .querySelectorAll(
            "[data-delete-category]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    deleteCategory(
                        button.dataset.deleteCategory
                    )
            );

        });
}

function openCategoryModal() {

    const modal =
        $("categoryModal");

    if (!modal) return;

    $("categoryName").value = "";

    message(
        "categoryFormMessage",
        ""
    );

    modal.classList.remove("hidden");
    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    $("categoryName")?.focus();
}

function closeCategoryModal() {

    const modal =
        $("categoryModal");

    if (!modal) return;

    modal.classList.add("hidden");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}

async function addCategory(e) {

    e.preventDefault();

    const name =
        $("categoryName")?.value.trim();

    if (!name) {

        message(
            "categoryFormMessage",
            "Category name is required."
        );

        return;
    }

    try {

        const { error } =
            await supabaseClient
                .from("categories")
                .insert({
                    name,
                    slug: slugify(name)
                });

        if (error) throw error;

        closeCategoryModal();

        toast("Category added successfully.");

        await refresh();

    } catch (error) {

        console.error(error);

        message(
            "categoryFormMessage",
            error.message ||
            "Unable to add category."
        );
    }
}

async function deleteCategory(id) {

    const category =
        categories.find(
            item => String(item.id) === String(id)
        );

    if (!category) return;

    if (
        !confirm(
            `Delete "${category.name}"?`
        )
    ) {
        return;
    }

    const { error } =
        await supabaseClient
            .from("categories")
            .delete()
            .eq("id", id);

    if (error) {

        console.error(error);

        toast(
            error.message ||
            "Unable to delete category.",
            "error"
        );

        return;
    }

    toast("Category deleted.");

    await refresh();
}

/* =========================================================
   CONTENT
   ========================================================= */

const contentTables = [
    {
        type: "movie",
        table: "movies"
    },
    {
        type: "series",
        table: "series"
    },
    {
        type: "music",
        table: "music"
    },
    {
        type: "radio",
        table: "radio_stations"
    }
];

async function loadContent() {

    const all = [];

    for (const source of contentTables) {

        let query =
            supabaseClient
                .from(source.table)
                .select("*");

        const { data, error } =
            await query;

        if (error) {
            console.error(
                source.table,
                error
            );
            continue;
        }

        (data || []).forEach(row => {

            all.push({
                ...row,
                _type: source.type,
                _table: source.table
            });

        });
    }

    content = all.sort(
        (a, b) =>
            new Date(b.created_at || 0) -
            new Date(a.created_at || 0)
    );

    renderContent();
    updateStats();
    renderRecent();
}

function categoryName(id) {

    const category =
        categories.find(
            item =>
                String(item.id) ===
                String(id)
        );

    return category?.name || "—";
}

function renderContent() {

    const body =
        $("contentTableBody");

    if (!body) return;

    const search =
        $("contentSearch")?.value
            .toLowerCase()
            .trim() || "";

    const filter =
        $("contentTypeFilter")?.value ||
        "all";

    const rows =
        content.filter(item => {

            const typeMatch =
                filter === "all" ||
                item._type === filter;

            const title =
                item.title ||
                item.name ||
                "";

            const searchMatch =
                !search ||
                title
                    .toLowerCase()
                    .includes(search);

            return typeMatch &&
                searchMatch;
        });

    if (!rows.length) {

        body.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="table-empty"
                >
                    No content available.
                </td>
            </tr>
        `;

        return;
    }

    body.innerHTML =
        rows.map(item => {

            const title =
                item.title ||
                item.name ||
                "Untitled";

            const year =
                item.release_year ||
                "—";

            const published =
                item.is_published;

            return `
                <tr>

                    <td>
                        ${escapeHTML(title)}
                    </td>

                    <td>
                        ${escapeHTML(item._type)}
                    </td>

                    <td>
                        ${escapeHTML(
                            categoryName(
                                item.category_id
                            )
                        )}
                    </td>

                    <td>
                        ${year}
                    </td>

                    <td>

                        <span
                            class="status-badge
                            ${published
                                ? "published"
                                : "draft"}"
                        >
                            ${
                                published
                                    ? "Published"
                                    : "Draft"
                            }
                        </span>

                    </td>

                    <td>

                        <div
                            class="table-actions"
                        >

                            <button
                                type="button"
                                class="table-action"
                                data-edit-id="${item._table}:${item.id}"
                            >
                                ✎
                            </button>

                            <button
                                type="button"
                                class="table-action delete"
                                data-delete-id="${item._table}:${item.id}"
                            >
                                ×
                            </button>

                        </div>

                    </td>

                </tr>
            `;
        }).join("");

    body
        .querySelectorAll(
            "[data-edit-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const [table, id] =
                        button.dataset.editId
                            .split(":");

                    const item =
                        content.find(
                            row =>
                                row._table === table &&
                                String(row.id) ===
                                String(id)
                        );

                    if (item) {
                        openContentModal(item);
                    }
                }
            );
        });

    body
        .querySelectorAll(
            "[data-delete-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const [table, id] =
                        button.dataset.deleteId
                            .split(":");

                    const item =
                        content.find(
                            row =>
                                row._table === table &&
                                String(row.id) ===
                                String(id)
                        );

                    if (item) {
                        deleteContent(item);
                    }
                }
            );
        });
}

/* =========================================================
   CONTENT MODAL
   ========================================================= */

function openContentModal(item = null) {

    const modal =
        $("contentModal");

    if (!modal) return;

    $("contentForm")?.reset();

    $("contentId").value = "";

    if ($("contentPublished")) {
        $("contentPublished").checked =
            true;
    }

    if ($("contentModalTitle")) {
        $("contentModalTitle").textContent =
            item
                ? "Edit Content"
                : "Add Content";
    }

    if (item) {

        $("contentId").value =
            `${item._table}:${item.id}`;

        $("contentTitle").value =
            item.title ||
            item.name ||
            "";

        $("contentType").value =
            item._type;

        $("contentYear").value =
            item.release_year ||
            "";

        $("contentCategory").value =
            item.category_id ||
            "";

        $("posterUrl").value =
            item.poster_url ||
            item.cover_url ||
            item.logo_url ||
            "";

        $("videoUrl").value =
            item.video_url ||
            item.audio_url ||
            item.stream_url ||
            "";

        $("contentDescription").value =
            item.description ||
            "";

        $("contentPublished").checked =
            !!item.is_published;
    }

    message(
        "contentFormMessage",
        ""
    );

    modal.classList.remove("hidden");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}

function closeContentModal() {

    const modal =
        $("contentModal");

    if (!modal) return;

    modal.classList.add("hidden");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}

function createPayload(type) {

    const title =
        $("contentTitle")
            ?.value
            .trim() || "";

    const year =
        $("contentYear")?.value;

    const category =
        $("contentCategory")?.value ||
        null;

    const poster =
        $("posterUrl")
            ?.value
            .trim() || null;

    const media =
        $("videoUrl")
            ?.value
            .trim() || null;

    const description =
        $("contentDescription")
            ?.value
            .trim() || null;

    const published =
        $("contentPublished")
            ?.checked ?? true;

    if (type === "movie") {

        return {
            title,
            description,
            release_year:
                year
                    ? Number(year)
                    : null,
            poster_url: poster,
            video_url: media,
            category_id: category,
            is_published: published
        };
    }

    if (type === "series") {

        return {
            title,
            description,
            release_year:
                year
                    ? Number(year)
                    : null,
            poster_url: poster,
            category_id: category,
            is_published: published
        };
    }

    if (type === "music") {

        return {
            title,
            artist: "",
            cover_url: poster,
            audio_url: media,
            is_published: published
        };
    }

    if (type === "radio") {

        return {
            name: title,
            description,
            logo_url: poster,
            stream_url: media,
            is_live: false,
            is_published: published
        };
    }

    throw new Error(
        "Invalid content type."
    );
}

async function saveContent(e) {

    e.preventDefault();

    const title =
        $("contentTitle")
            ?.value
            .trim();

    const type =
        $("contentType")
            ?.value ||
        "movie";

    const existing =
        $("contentId")
            ?.value || "";

    if (!title) {

        message(
            "contentFormMessage",
            "Title is required."
        );

        return;
    }

    try {

        const payload =
            createPayload(type);

        if (existing) {

            const [table, id] =
                existing.split(":");

            const { error } =
                await supabaseClient
                    .from(table)
                    .update(payload)
                    .eq("id", id);

            if (error) throw error;

            toast("Content updated.");

        } else {

            const source =
                contentTables.find(
                    item =>
                        item.type === type
                );

            if (!source) {
                throw new Error(
                    "Invalid content type."
                );
            }

            const { error } =
                await supabaseClient
                    .from(source.table)
                    .insert(payload);

            if (error) throw error;

            toast("Content added.");
        }

        closeContentModal();

        await refresh();

    } catch (error) {

        console.error(error);

        message(
            "contentFormMessage",
            error.message ||
            "Unable to save content."
        );
    }
}

async function deleteContent(item) {

    const title =
        item.title ||
        item.name ||
        "this content";

    if (
        !confirm(
            `Delete "${title}"?`
        )
    ) {
        return;
    }

    const { error } =
        await supabaseClient
            .from(item._table)
            .delete()
            .eq("id", item.id);

    if (error) {

        console.error(error);

        toast(
            error.message ||
            "Unable to delete content.",
            "error"
        );

        return;
    }

    toast("Content deleted.");

    await refresh();
}

/* =========================================================
   STATS
   ========================================================= */

function updateStats() {

    const movies =
        content.filter(
            item =>
                item._type === "movie"
        ).length;

    const series =
        content.filter(
            item =>
                item._type === "series"
        ).length;

    if ($("statContent")) {
        $("statContent").textContent =
            content.length;
    }

    if ($("statMovies")) {
        $("statMovies").textContent =
            movies;
    }

    if ($("statSeries")) {
        $("statSeries").textContent =
            series;
    }

    /*
       auth.users cannot be read directly
       from the browser client.
    */

    if ($("statUsers")) {
        $("statUsers").textContent = "—";
    }
}

/* =========================================================
   RECENT CONTENT
   ========================================================= */

function renderRecent() {

    const container =
        $("recentContent");

    if (!container) return;

    const rows =
        content.slice(0, 5);

    if (!rows.length) {

        container.innerHTML = `
            <div class="empty-state">
                <span>▣</span>
                <p>No content yet.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        rows.map(item => {

            const title =
                item.title ||
                item.name ||
                "Untitled";

            return `
                <div
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:12px;
                        padding:14px 18px;
                        border-bottom:1px solid
                        rgba(255,255,255,.05);
                    "
                >

                    <div>

                        <strong>
                            ${escapeHTML(title)}
                        </strong>

                        <small
                            style="
                                display:block;
                                margin-top:4px;
                                color:var(--text-muted);
                            "
                        >
                            ${escapeHTML(
                                item._type
                            )}
                        </small>

                    </div>

                    <span
                        class="status-badge
                        ${
                            item.is_published
                                ? "published"
                                : "draft"
                        }"
                    >
                        ${
                            item.is_published
                                ? "Published"
                                : "Draft"
                        }
                    </span>

                </div>
            `;

        }).join("");
}

/* =========================================================
   SETTINGS
   ========================================================= */

async function loadSettings() {

    const { data, error } =
        await supabaseClient
            .from("app_settings")
            .select("key,value")
            .in(
                "key",
                [
                    "site_name",
                    "site_description"
                ]
            );

    if (error) {

        console.error(
            "Settings error:",
            error
        );

        return;
    }

    const settings =
        Object.fromEntries(
            (data || []).map(
                item =>
                    [
                        item.key,
                        item.value
                    ]
            )
        );

    if ($("siteName")) {
        $("siteName").value =
            settings.site_name ||
            "StreamBox";
    }

    if ($("siteDescription")) {
        $("siteDescription").value =
            settings.site_description ||
            "";
    }
}

async function saveSettings(e) {

    e.preventDefault();

    const name =
        $("siteName")
            ?.value
            .trim() ||
        "StreamBox";

    const description =
        $("siteDescription")
            ?.value
            .trim() ||
        "";

    const { error } =
        await supabaseClient
            .from("app_settings")
            .upsert(
                [
                    {
                        key: "site_name",
                        value: name
                    },
                    {
                        key: "site_description",
                        value: description
                    }
                ],
                {
                    onConflict: "key"
                }
            );

    if (error) {

        console.error(error);

        toast(
            error.message ||
            "Unable to save settings.",
            "error"
        );

        return;
    }

    toast("Settings saved.");
}

/* =========================================================
   USERS
   ========================================================= */

function loadUsers() {

    const body =
        $("usersTableBody");

    if (!body) return;

    body.innerHTML = `
        <tr>
            <td
                colspan="3"
                class="table-empty"
            >
                Users are managed by
                Supabase Authentication.
            </td>
        </tr>
    `;
}

/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

    await supabaseClient.auth.signOut();

    window.location.href =
        "login.html";
}

/* =========================================================
   MODALS
   ========================================================= */

function initModals() {

    $("addContentButton")
        ?.addEventListener(
            "click",
            () => openContentModal()
        );

    $("addCategoryButton")
        ?.addEventListener(
            "click",
            openCategoryModal
        );

    $("contentForm")
        ?.addEventListener(
            "submit",
            saveContent
        );

    $("categoryForm")
        ?.addEventListener(
            "submit",
            addCategory
        );

    $("platformSettingsForm")
        ?.addEventListener(
            "submit",
            saveSettings
        );

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(element => {

            element.addEventListener(
                "click",
                closeContentModal
            );
        });

    $("logoutButton")
        ?.addEventListener(
            "click",
            logout
        );

    $("settingsLogoutButton")
        ?.addEventListener(
            "click",
            logout
        );

    $("contentSearch")
        ?.addEventListener(
            "input",
            renderContent
        );

    $("contentTypeFilter")
        ?.addEventListener(
            "change",
            renderContent
        );

    document
        .querySelectorAll(
            "[data-close-category-modal]"
        )
        .forEach(element => {

            element.addEventListener(
                "click",
                closeCategoryModal
            );
        });

    document.addEventListener(
        "keydown",
        e => {

            if (e.key !== "Escape")
                return;

            closeContentModal();
            closeCategoryModal();
        }
    );
}

/* =========================================================
   REFRESH EVERYTHING
   ========================================================= */

async function refresh() {

    await loadCategories();

    await loadContent();

    await loadSettings();

    loadUsers();
}

/* =========================================================
   DASHBOARD INIT
   ========================================================= */

async function initDashboard() {

    if (!$("adminApp"))
        return;

    const user =
        await protectDashboard();

    if (!user)
        return;

    const email =
        user.email ||
        "Admin";

    if ($("adminEmail")) {
        $("adminEmail").textContent =
            email;
    }

    if ($("settingsAdminEmail")) {
        $("settingsAdminEmail").textContent =
            email;
    }

    if ($("accountAvatar")) {
        $("accountAvatar").textContent =
            email
                .charAt(0)
                .toUpperCase();
    }

    initNavigation();

    initModals();

    await refresh();
}

/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initLogin();

        initDashboard();

    }
);