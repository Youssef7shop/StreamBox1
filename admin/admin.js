/* =========================================================
   StreamBox Admin
   admin/admin.js
   ========================================================= */

/* ---------------------------------------------------------
   1. SUPABASE CONFIG
   --------------------------------------------------------- */

// نفس بيانات Supabase اللي مستعملة فـ app.js
const SUPABASE_URL = "https://lxpjoemravgwlbllmabh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_G189DQuZqugIVHfZOYNvNw_tGr3LbNw";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


/* ---------------------------------------------------------
   2. DOM ELEMENTS
   --------------------------------------------------------- */

const loginForm = document.getElementById("adminLoginForm");

const emailInput = document.getElementById("adminEmail");
const passwordInput = document.getElementById("adminPassword");

const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");
const loginSpinner = document.getElementById("loginSpinner");

const togglePasswordButton =
    document.getElementById("togglePassword");

const loginError =
    document.getElementById("loginError");

const loginSuccess =
    document.getElementById("loginSuccess");


/* ---------------------------------------------------------
   3. HELPERS
   --------------------------------------------------------- */

function showError(message) {
    if (!loginError) return;

    loginError.textContent = message;
    loginError.classList.remove("hidden");

    if (loginSuccess) {
        loginSuccess.classList.add("hidden");
    }
}


function showSuccess(message) {
    if (!loginSuccess) return;

    loginSuccess.textContent = message;
    loginSuccess.classList.remove("hidden");

    if (loginError) {
        loginError.classList.add("hidden");
    }
}


function clearMessages() {
    if (loginError) {
        loginError.textContent = "";
        loginError.classList.add("hidden");
    }

    if (loginSuccess) {
        loginSuccess.textContent = "";
        loginSuccess.classList.add("hidden");
    }
}


function setLoading(isLoading) {
    if (!loginButton) return;

    loginButton.disabled = isLoading;

    if (loginSpinner) {
        loginSpinner.classList.toggle("hidden", !isLoading);
    }

    if (loginButtonText) {
        loginButtonText.textContent =
            isLoading ? "Signing in..." : "Sign In";
    }
}


/* ---------------------------------------------------------
   4. PASSWORD VISIBILITY
   --------------------------------------------------------- */

if (togglePasswordButton && passwordInput) {

    togglePasswordButton.addEventListener("click", () => {

        const isPassword =
            passwordInput.type === "password";

        passwordInput.type =
            isPassword ? "text" : "password";

        togglePasswordButton.textContent =
            isPassword ? "Hide" : "Show";

        togglePasswordButton.setAttribute(
            "aria-label",
            isPassword ? "Hide password" : "Show password"
        );
    });
}


/* ---------------------------------------------------------
   5. CHECK ADMIN PROFILE
   --------------------------------------------------------- */

/*
   بعد Supabase Auth، كنشوفو واش المستخدم عندو
   profile فـ admin_profiles والـrole ديالو هو admin.

   Expected table:

   admin_profiles
   -------------------------
   id
   email
   role
   created_at
*/

async function checkAdminRole(user) {

    if (!user || !user.id) {
        return false;
    }

    try {

        const { data, error } =
            await supabaseClient
                .from("admin_profiles")
                .select("id, email, role")
                .eq("id", user.id)
                .maybeSingle();

        if (error) {
            console.error(
                "Admin profile error:",
                error
            );

            return false;
        }

        if (!data) {
            return false;
        }

        return data.role === "admin";

    } catch (error) {

        console.error(
            "Admin role check failed:",
            error
        );

        return false;
    }
}


/* ---------------------------------------------------------
   6. REDIRECT TO DASHBOARD
   --------------------------------------------------------- */

function redirectToDashboard() {

    window.location.href = "index.html";
}


/* ---------------------------------------------------------
   7. LOGIN
   --------------------------------------------------------- */

async function handleLogin(event) {

    event.preventDefault();

    clearMessages();

    const email =
        emailInput?.value.trim();

    const password =
        passwordInput?.value || "";

    if (!email) {
        showError("Please enter your email.");
        emailInput?.focus();
        return;
    }

    if (!password) {
        showError("Please enter your password.");
        passwordInput?.focus();
        return;
    }

    setLoading(true);

    try {

        /*
         * Supabase Authentication
         */

        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });


        if (error) {

            console.error(
                "Supabase login error:",
                error
            );

            showError(
                "Invalid email or password."
            );

            return;
        }


        const user = data?.user;

        if (!user) {

            showError(
                "Unable to create an authenticated session."
            );

            return;
        }


        /*
         * Verify admin role
         */

        const isAdmin =
            await checkAdminRole(user);


        if (!isAdmin) {

            /*
             * User authenticated successfully,
             * but is not an admin.
             */

            await supabaseClient.auth.signOut();

            showError(
                "This account does not have administrator access."
            );

            return;
        }


        /*
         * Everything is valid.
         */

        showSuccess(
            "Login successful. Redirecting..."
        );

        setTimeout(
            redirectToDashboard,
            500
        );

    } catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );

        showError(
            "Something went wrong. Please try again."
        );

    } finally {

        setLoading(false);
    }
}


/* ---------------------------------------------------------
   8. LOGIN FORM EVENT
   --------------------------------------------------------- */

if (loginForm) {
    loginForm.addEventListener(
        "submit",
        handleLogin
    );
}


/* ---------------------------------------------------------
   9. CHECK EXISTING SESSION
   --------------------------------------------------------- */

/*
   إلا كان الأدمن داخل من قبل وsession مازال صالحة،
   ماكاينش علاش يبقى فصفحة Login.
*/

async function checkExistingSession() {

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

            return;
        }


        const session =
            data?.session;


        if (!session?.user) {
            return;
        }


        const isAdmin =
            await checkAdminRole(
                session.user
            );


        if (isAdmin) {

            redirectToDashboard();

        } else {

            /*
             * Session موجودة ولكن الحساب
             * ماشي Admin.
             */

            await supabaseClient.auth.signOut();
        }

    } catch (error) {

        console.error(
            "Session check failed:",
            error
        );
    }
}


/* ---------------------------------------------------------
   10. AUTH STATE LISTENER
   --------------------------------------------------------- */

supabaseClient.auth.onAuthStateChange(
    (event, session) => {

        console.log(
            "Auth event:",
            event
        );

        /*
         * ما نديروش redirect هنا مباشرة مع SIGNED_IN،
         * حيث handleLogin أصلاً كيتحقق من admin role.
         */
    }
);


/* ---------------------------------------------------------
   11. INITIALIZE
   --------------------------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        checkExistingSession();

    }
);