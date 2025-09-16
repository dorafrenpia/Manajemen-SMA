// login.js
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const popup = document.getElementById("popup");

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault(); // cegah form submit default

        const username = document.getElementById("nama").value.trim();
        const password = document.getElementById("password").value.trim();

        // validasi username dan password
        if (username === "IT" && password === "IT") {
            // jika benar, redirect ke IT/IT.html
            window.location.href = "/IT/IT.html";
        } else {
            // jika salah, tampilkan pesan error
            popup.textContent = "Username atau password salah!";
            popup.style.color = "red";
            popup.style.marginTop = "10px";
        }
    });
});
