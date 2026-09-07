/* =========================================================
   STREAMBOX ADMIN - COMPLETE admin.js
   ========================================================= */

const SUPABASE_URL =
    "https://lxpjoemravgwlbllmabh.supabase.co";

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

    box.classList.remove(
        "show",
        "success",
        "error",
        "warning"
    );

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
    el.classList.remove("error", "success", "warning");
    el.classList.add(type);
}


/* =========================================================
   AUTH
   ========================================================= */

async function getSessionUser() {
    try {
        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (error) {
            console.error("Session error:", error);
            return null;
        }

        return data?.session?.user || null;

    } catch (error) {
        console.error("Session exception:", error);
        return null;
    }
}


async function isAdmin(user) {
    if (!user?.id) return false;

    try {
        const {
            data,
            error
        } = await supabaseClient
            .from("admin_profiles")
            .select("id,user_id,role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .maybeSingle();

        if (error) {
            console.error("Admin verification error:", error);
            return false;
        }

        return Boolean(data);

    } catch (error) {
        console.error("Admin verification exception:", error);
        return false;
    }
}


/* =========================================================
   LOGIN PAGE
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

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        errorBox?.classList.add("hidden");
        successBox?.classList.add("hidden");

        const emailValue =
            email?.value?.trim() || "";

        const passwordValue =
            password?.value || "";

        if (!emailValue) {
            if (errorBox) {
                errorBox.textContent =
                    "Please enter your email.";
                errorBox.classList.remove("hidden");
            }
            return;
        }

        if (!passwordValue) {
            if (errorBox) {
                errorBox.textContent =
                    "Please enter your password.";
                errorBox.classList.remove("hidden");
            }
            return;
        }

        if (button) {
            button.disabled = true;
        }

        spinner?.classList.remove("hidden");

        if (buttonText) {
            buttonText.textContent = "Signing in...";
        }

        try {
            const {
                data,
                error
            } = await supabaseClient.auth.signInWithPassword({
                email: emailValue,
                password: passwordValue
            });

            if (error) {
                throw error;
            }

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

            window.setTimeout(() => {
                window.location.href = "index.html";
            }, 300);

        } catch (error) {
            console.error("Login error:", error);

            if (errorBox) {
                errorBox.textContent =
                    error?.message ||
                    "Invalid email or password.";

                errorBox.classList.remove("hidden");
            }

        } finally {
            if (button) {
                button.disabled = false;
            }

            spinner?.classList.add("hidden");

            if (buttonText) {
                buttonText.textContent = "Sign In";
            }
        }
    });
}


/* =========================================================
   DASHBOARD PROTECTION
   ========================================================= */

async function protectDashboard() {
    const app = $("adminApp");

    if (!app) {
        return null;
    }

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

                const section =
                    button.dataset.section;

                document
                    .querySelectorAll(".nav-item")
                    .forEach((item) => {
                        item.classList.remove("active");
                    });

                button.classList.add("active");

                document
                    .querySelectorAll(".admin-section")
                    .forEach((sectionElement) => {
                        sectionElement.classList.remove("active");
                    });

                const target =
                    $(`section-${section}`);

                if (target) {
                    target.classList.add("active");
                }

                const titles = {
                    overview: "Overview",
                    content: "Content",
                    categories: "Categories",
                    users: "Users",
                    settings: "Settings"
                };

                if ($("pageTitle")) {
                    $("pageTitle").textContent =
                        titles[section] || "Overview";
                }

                closeMobileSidebar();
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
   MOBILE SIDEBAR
   ========================================================= */

function initSidebar() {

    const sidebar = $("adminSidebar");
    const openButton = $("openSidebar");
    const closeButton = $("closeSidebar");

    if (!sidebar) return;

    openButton?.addEventListener("click", () => {
        sidebar.classList.add("open");
    });

    closeButton?.addEventListener("click", () => {
        closeMobileSidebar();
    });
}


function closeMobileSidebar() {

    $("adminSidebar")?.classList.remove("open");
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

    const {
        data,
        error
    } = await supabaseClient
        .from("categories")
        .select("*")
        .order("name", {
            ascending: true
        });

    if (error) {
        console.error("Categories error:", error);

        categories = [];

        renderCategories();
        fillCategorySelect();

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

        ${categories
            .map((category) => `
                <option value="${escapeHTML(category.id)}">
                    ${escapeHTML(category.name)}
                </option>
            `)
            .join("")}
    `;
}


function renderCategories() {

    const container =
        $("categoriesGrid");

    if (!container) return;

    if (!categories.length) {

        container.innerHTML = `
            <div class="empty-state">
                <span>◫</span>
                <p>No categories yet.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        categories
            .map((category) => {

                const count =
                    content.filter(
                        (item) =>
                            String(item.category_id) ===
                            String(category.id)
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
                                data-delete-category="${escapeHTML(category.id)}"
                            >
                                Delete
                            </button>

                        </div>

                    </div>
                `;
            })
            .join("");


    container
        .querySelectorAll("[data-delete-category]")
        .forEach((button) => {

            button.addEventListener("click", () => {

                deleteCategory(
                    button.dataset.deleteCategory
                );

            });

        });
}


function openCategoryModal() {

    const modal =
        $("categoryModal");

    if (!modal) return;

    const input =
        $("categoryName");

    if (input) {
        input.value = "";
    }

    message(
        "categoryFormMessage",
        ""
    );

    modal.classList.remove("hidden");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    input?.focus();
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


async function addCategory(event) {

    event.preventDefault();

    const name =
        $("categoryName")
            ?.value
            ?.trim() || "";

    if (!name) {

        message(
            "categoryFormMessage",
            "Category name is required."
        );

        return;
    }

    try {

        const {
            error
        } = await supabaseClient
            .from("categories")
            .insert({
                name: name,
                slug: slugify(name)
            });

        if (error) {
            throw error;
        }

        closeCategoryModal();

        toast(
            "Category added successfully."
        );

        await refresh();

    } catch (error) {

        console.error("Add category error:", error);

        message(
            "categoryFormMessage",
            error?.message ||
            "Unable to add category."
        );
    }
}


async function deleteCategory(id) {

    const category =
        categories.find(
            (item) =>
                String(item.id) === String(id)
        );

    if (!category) return;

    const confirmed =
        await openConfirmModal(
            "Delete Category",
            `Delete "${category.name}"?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const {
            error
        } = await supabaseClient
            .from("categories")
            .delete()
            .eq("id", id);

        if (error) {
            throw error;
        }

        toast("Category deleted.");

        await refresh();

    } catch (error) {

        console.error(
            "Delete category error:",
            error
        );

        toast(
            error?.message ||
            "Unable to delete category.",
            "error"
        );
    }
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

        const {
            data,
            error
        } = await supabaseClient
            .from(source.table)
            .select("*");

        if (error) {

            console.error(
                `${source.table} error:`,
                error
            );

            continue;
        }

        (data || []).forEach((row) => {

            all.push({
                ...row,
                _type: source.type,
                _table: source.table
            });

        });
    }

    content =
        all.sort(
            (a, b) =>
                new Date(b.created_at || 0) -
                new Date(a.created_at || 0)
        );

    renderContent();
    updateStats();
    renderRecent();
    renderCategories();
}


function categoryName(id) {

    const category =
        categories.find(
            (item) =>
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
        $("contentSearch")
            ?.value
            ?.toLowerCase()
            ?.trim() || "";

    const filter =
        $("contentTypeFilter")
            ?.value || "all";


    const rows =
        content.filter((item) => {

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
        rows
            .map((item) => {

                const title =
                    item.title ||
                    item.name ||
                    "Untitled";

                const year =
                    item.release_year ||
                    "—";

                const published =
                    Boolean(item.is_published);

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
                            ${escapeHTML(year)}
                        </td>

                        <td>

                            <span
                                class="status-badge ${
                                    published
                                        ? "published"
                                        : "draft"
                                }"
                            >
                                ${
                                    published
                                        ? "Published"
                                        : "Draft"
                                }
                            </span>

                        </td>

                        <td>

                            <div class="table-actions">

                                <button
                                    type="button"
                                    class="table-action"
                                    data-edit-id="${escapeHTML(
                                        item._table
                                    )}:${escapeHTML(
                                        item.id
                                    )}"
                                    title="Edit"
                                >
                                    ✎
                                </button>

                                <button
                                    type="button"
                                    class="table-action delete"
                                    data-delete-id="${escapeHTML(
                                        item._table
                                    )}:${escapeHTML(
                                        item.id
                                    )}"
                                    title="Delete"
                                >
                                    ×
                                </button>

                            </div>

                        </td>

                    </tr>
                `;
            })
            .join("");


    body
        .querySelectorAll("[data-edit-id]")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const [
                        table,
                        id
                    ] =
                        button.dataset.editId
                            .split(":");

                    const item =
                        content.find(
                            (row) =>
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
        .querySelectorAll("[data-delete-id]")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const [
                        table,
                        id
                    ] =
                        button.dataset.deleteId
                            .split(":");

                    const item =
                        content.find(
                            (row) =>
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

    if ($("contentId")) {
        $("contentId").value = "";
    }

    if ($("contentPublished")) {
        $("contentPublished").checked = true;
    }

    if ($("contentModalTitle")) {
        $("contentModalTitle").textContent =
            item
                ? "Edit Content"
                : "Add Content";
    }


    if (item) {

        if ($("contentId")) {
            $("contentId").value =
                `${item._table}:${item.id}`;
        }

        if ($("contentTitle")) {
            $("contentTitle").value =
                item.title ||
                item.name ||
                "";
        }

        if ($("contentType")) {
            $("contentType").value =
                item._type;
        }

        if ($("contentYear")) {
            $("contentYear").value =
                item.release_year ||
                "";
        }

        if ($("contentCategory")) {
            $("contentCategory").value =
                item.category_id ||
                "";
        }

        if ($("posterUrl")) {
            $("posterUrl").value =
                item.poster_url ||
                item.cover_url ||
                item.logo_url ||
                "";
        }

        if ($("videoUrl")) {
            $("videoUrl").value =
                item.video_url ||
                item.audio_url ||
                item.stream_url ||
                "";
        }

        if ($("contentDescription")) {
            $("contentDescription").value =
                item.description ||
                "";
        }

        if ($("contentPublished")) {
            $("contentPublished").checked =
                Boolean(item.is_published);
        }
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
            ?.trim() || "";

    const year =
        $("contentYear")
            ?.value || "";

    const category =
        $("contentCategory")
            ?.value || null;

    const poster =
        $("posterUrl")
            ?.value
            ?.trim() || null;

    const media =
        $("videoUrl")
            ?.value
            ?.trim() || null;

    const description =
        $("contentDescription")
            ?.value
            ?.trim() || null;

    const published =
        $("contentPublished")
            ?.checked ?? true;


    if (type === "movie") {

        return {
            title: title,
            description: description,
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
            title: title,
            description: description,
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
            title: title,
            artist: "",
            cover_url: poster,
            audio_url: media,
            is_published: published
        };
    }


    if (type === "radio") {

        return {
            name: title,
            description: description,
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


async function saveContent(event) {

    event.preventDefault();

    const title =
        $("contentTitle")
            ?.value
            ?.trim() || "";

    const type =
        $("contentType")
            ?.value || "movie";

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


    const saveButton =
        $("saveContentButton");

    if (saveButton) {
        saveButton.disabled = true;
    }


    try {

        const payload =
            createPayload(type);


        if (existing) {

            const [
                table,
                id
            ] =
                existing.split(":");


            const {
                error
            } = await supabaseClient
                .from(table)
                .update(payload)
                .eq("id", id);

            if (error) {
                throw error;
            }

            toast("Content updated.");

        } else {

            const source =
                contentTables.find(
                    (item) =>
                        item.type === type
                );

            if (!source) {
                throw new Error(
                    "Invalid content type."
                );
            }


            const {
                error
            } = await supabaseClient
                .from(source.table)
                .insert(payload);

            if (error) {
                throw error;
            }

            toast("Content added.");
        }


        closeContentModal();

        await refresh();

    } catch (error) {

        console.error(
            "Save content error:",
            error
        );

        message(
            "contentFormMessage",
            error?.message ||
            "Unable to save content."
        );

    } finally {

        if (saveButton) {
            saveButton.disabled = false;
        }
    }
}


async function deleteContent(item) {

    const title =
        item.title ||
        item.name ||
        "this content";


    const confirmed =
        await openConfirmModal(
            "Delete Content",
            `Delete "${title}"?`
        );

    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } = await supabaseClient
            .from(item._table)
            .delete()
            .eq("id", item.id);

        if (error) {
            throw error;
        }

        toast("Content deleted.");

        await refresh();

    } catch (error) {

        console.error(
            "Delete content error:",
            error
        );

        toast(
            error?.message ||
            "Unable to delete content.",
            "error"
        );
    }
}


/* =========================================================
   STATS
   ========================================================= */

function updateStats() {

    const movies =
        content.filter(
            (item) =>
                item._type === "movie"
        ).length;

    const series =
        content.filter(
            (item) =>
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
        rows
            .map((item) => {

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
                                ${escapeHTML(item._type)}
                            </small>

                        </div>

                        <span
                            class="status-badge ${
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
            })
            .join("");
}


/* =========================================================
   SETTINGS
   ========================================================= */

async function loadSettings() {

    const {
        data,
        error
    } = await supabaseClient
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
                (item) => [
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


async function saveSettings(event) {

    event.preventDefault();


    const name =
        $("siteName")
            ?.value
            ?.trim() ||
        "StreamBox";

    const description =
        $("siteDescription")
            ?.value
            ?.trim() ||
        "";


    try {

        const {
            error
        } = await supabaseClient
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
            throw error;
        }

        toast("Settings saved.");

    } catch (error) {

        console.error(
            "Settings save error:",
            error
        );

        toast(
            error?.message ||
            "Unable to save settings.",
            "error"
        );
    }
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
   CONFIRM MODAL
   ========================================================= */

let confirmResolver = null;


function openConfirmModal(
    title = "Are you sure?",
    text = "This action cannot be undone."
) {

    return new Promise((resolve) => {

        const modal =
            $("confirmModal");

        if (!modal) {

            resolve(
                window.confirm(text)
            );

            return;
        }


        confirmResolver = resolve;


        if ($("confirmTitle")) {
            $("confirmTitle").textContent =
                title;
        }

        if ($("confirmMessage")) {
            $("confirmMessage").textContent =
                text;
        }


        modal.classList.remove("hidden");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );
    });
}


function closeConfirmModal(result = false) {

    const modal =
        $("confirmModal");

    if (modal) {

        modal.classList.add("hidden");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );
    }


    if (confirmResolver) {

        const resolve =
            confirmResolver;

        confirmResolver = null;

        resolve(result);
    }
}


/* =========================================================
   MODALS / EVENTS
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
        .querySelectorAll("[data-close-modal]")
        .forEach((element) => {

            element.addEventListener(
                "click",
                closeContentModal
            );

        });


    document
        .querySelectorAll("[data-close-category-modal]")
        .forEach((element) => {

            element.addEventListener(
                "click",
                closeCategoryModal
            );

        });


    document
        .querySelectorAll("[data-close-confirm]")
        .forEach((element) => {

            element.addEventListener(
                "click",
                () => closeConfirmModal(false)
            );

        });


    $("cancelConfirm")
        ?.addEventListener(
            "click",
            () => closeConfirmModal(false)
        );


    $("confirmAction")
        ?.addEventListener(
            "click",
            () => closeConfirmModal(true)
        );


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


    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key !== "Escape") {
                return;
            }

            closeContentModal();
            closeCategoryModal();

            if (
                $("confirmModal") &&
                !$("confirmModal")
                    .classList
                    .contains("hidden")
            ) {
                closeConfirmModal(false);
            }
        }
    );
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

    try {

        await supabaseClient.auth.signOut();

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    } finally {

        window.location.href =
            "login.html";
    }
}


/* =========================================================
   REFRESH
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

    if (!$("adminApp")) {
        return;
    }


    const user =
        await protectDashboard();

    if (!user) {
        return;
    }


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

    initSidebar();

    initModals();


    try {

        await refresh();

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

        toast(
            "Some dashboard data could not be loaded.",
            "warning"
        );
    }
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