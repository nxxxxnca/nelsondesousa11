const menuToggle = document.getElementById("menuToggle");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");

function toggleMenu() {
	const isActive = sideMenu.classList.toggle("active");
	overlay.classList.toggle("active", isActive);
	menuToggle.classList.toggle("active", isActive);
	menuToggle.setAttribute("aria-expanded", isActive);
}

function closeMenu() {
	sideMenu.classList.remove("active");
	overlay.classList.remove("active");
	menuToggle.classList.remove("active");
	menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle.addEventListener("click", toggleMenu);
overlay.addEventListener("click", closeMenu);
