
const API = "/api/books";

const $ = (id) => document.getElementById(id);

async function request(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}

function showMessage(element, message, type = "info") {
    if (!element) return;
    element.textContent = message;
    element.className = `message ${type}`;
}

function money(value) {
    return Number(value).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    });
}

// Escape text before placing it inside HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function bookDetailsHTML(book) {
    return `
        <div class="detail-item"><span>Book ID</span><strong>${escapeHTML(book.id)}</strong></div>
        <div class="detail-item"><span>Title</span><strong>${escapeHTML(book.title)}</strong></div>
        <div class="detail-item"><span>Author</span><strong>${escapeHTML(book.author)}</strong></div>
        <div class="detail-item"><span>Category</span><strong>${escapeHTML(book.category)}</strong></div>
        <div class="detail-item"><span>Price</span><strong>${money(book.price)}</strong></div>
        <div class="detail-item"><span>Stock</span><strong>${escapeHTML(book.stock)} copies</strong></div>
    `;
}

async function getBooks() {
    return request(API);
}

async function getBook(id) {
    return request(`${API}/${encodeURIComponent(id)}`);
}

function bookTableRow(book, includeAction = false) {
    return `
        <tr>
            <td>#${escapeHTML(book.id)}</td>
            <td><strong>${escapeHTML(book.title)}</strong></td>
            <td>${escapeHTML(book.author)}</td>
            <td><span class="category-label">${escapeHTML(book.category)}</span></td>
            <td>${money(book.price)}</td>
            <td>${escapeHTML(book.stock)}</td>
            ${includeAction ? `
                <td>
                    <button class="btn btn-light view-one" type="button"
                        data-id="${escapeHTML(book.id)}">View Details</button>
                </td>` : ""}
        </tr>
    `;
}

function emptyRow(columns, message) {
    return `<tr><td colspan="${columns}" class="empty-state">${escapeHTML(message)}</td></tr>`;
}

// HOME PAGE
async function initHome() {
    try {
        const books = await getBooks();

        $("totalBooks").textContent = books.length;
        $("totalStock").textContent = books.reduce(
            (total, book) => total + Number(book.stock), 0
        );

        const totalValue = books.reduce(
            (total, book) => total + Number(book.price) * Number(book.stock), 0
        );

        $("inventoryValue").textContent = money(totalValue);
    } catch (error) {
        ["totalBooks", "totalStock", "inventoryValue"].forEach((id) => {
            $(id).textContent = "—";
        });
        console.error(error);
    }
}

// ADD PAGE
function initAdd() {
    const form = $("addForm");
    const message = $("formMessage");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const payload = {
            title: $("title").value.trim(),
            author: $("author").value.trim(),
            category: $("category").value.trim(),
            price: $("price").value,
            stock: $("stock").value
        };

        try {
            const result = await request(API, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            form.reset();
            showMessage(
                message,
                `${result.message} New book ID: ${result.id}`,
                "success"
            );
        } catch (error) {
            showMessage(message, error.message, "error");
        }
    });

    form.addEventListener("reset", () => {
        setTimeout(() => showMessage(message, ""), 0);
    });
}

// VIEW PAGE
async function initView() {
    const body = $("booksTableBody");
    const message = $("viewMessage");
    const detailsPanel = $("bookDetails");

    async function loadBooks() {
        body.innerHTML = emptyRow(7, "Loading books...");
        showMessage(message, "");

        try {
            const books = await getBooks();

            body.innerHTML = books.length
                ? books.map((book) => bookTableRow(book, true)).join("")
                : emptyRow(7, "No books found. Add your first book!");

        } catch (error) {
            body.innerHTML = emptyRow(7, "Unable to load books.");
            showMessage(message, error.message, "error");
        }
    }

    body.addEventListener("click", async (event) => {
        const button = event.target.closest(".view-one");
        if (!button) return;

        try {
            const book = await getBook(button.dataset.id);
            $("detailTitle").textContent = book.title;
            $("detailContent").innerHTML = bookDetailsHTML(book);
            detailsPanel.hidden = false;
            detailsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (error) {
            showMessage(message, error.message, "error");
        }
    });

    $("refreshBooks").addEventListener("click", loadBooks);
    $("closeDetails").addEventListener("click", () => {
        detailsPanel.hidden = true;
    });

    await loadBooks();
}

// UPDATE PAGE
function initUpdate() {
    const loadForm = $("loadUpdateForm");
    const updateForm = $("updateForm");
    const loadMessage = $("updateLoadMessage");
    const updateMessage = $("updateMessage");

    let currentId = null;

    loadForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const id = $("updateId").value.trim();

        updateForm.hidden = true;
        currentId = null;
        showMessage(loadMessage, "Loading book...", "info");
        showMessage(updateMessage, "");

        try {
            const book = await getBook(id);

            currentId = book.id;
            $("updateTitle").value = book.title;
            $("updateAuthor").value = book.author;
            $("updateCategory").value = book.category;
            $("updatePrice").value = book.price;
            $("updateStock").value = book.stock;

            updateForm.hidden = false;
            showMessage(loadMessage, `Book #${book.id} loaded successfully.`, "success");
        } catch (error) {
            showMessage(loadMessage, error.message, "error");
        }
    });

    updateForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (currentId === null) return;

        const payload = {
            title: $("updateTitle").value.trim(),
            author: $("updateAuthor").value.trim(),
            category: $("updateCategory").value.trim(),
            price: $("updatePrice").value,
            stock: $("updateStock").value
        };

        try {
            const result = await request(`${API}/${currentId}`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });

            showMessage(updateMessage, result.message, "success");
            showMessage(loadMessage, `Book #${currentId} has been updated.`, "success");
        } catch (error) {
            showMessage(updateMessage, error.message, "error");
        }
    });

    $("cancelUpdate").addEventListener("click", () => {
        currentId = null;
        updateForm.reset();
        updateForm.hidden = true;
        showMessage(updateMessage, "");
        showMessage(loadMessage, "Update cancelled.", "info");
    });
}

// SEARCH PAGE
function initSearch() {
    const form = $("searchForm");
    const input = $("searchInput");
    const body = $("searchTableBody");
    const count = $("searchCount");

    let books = [];

    function renderResults() {
        const term = input.value.trim().toLowerCase();

        const results = books.filter((book) => {
            const searchable = [
                book.id, book.title, book.author, book.category
            ].join(" ").toLowerCase();

            return searchable.includes(term);
        });

        body.innerHTML = results.length
            ? results.map((book) => bookTableRow(book)).join("")
            : emptyRow(6, "No matching books found.");

        count.textContent = `${results.length} book${results.length === 1 ? "" : "s"} found`;
    }

    async function loadBooks() {
        body.innerHTML = emptyRow(6, "Loading books...");
        count.textContent = "Loading books...";

        try {
            books = await getBooks();
            renderResults();
        } catch (error) {
            body.innerHTML = emptyRow(6, "Unable to load books.");
            count.textContent = error.message;
        }
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        renderResults();
    });

    input.addEventListener("input", renderResults);

    $("clearSearch").addEventListener("click", () => {
        input.value = "";
        renderResults();
        input.focus();
    });

    loadBooks();
}

// DELETE PAGE
function initDelete() {
    const loadForm = $("loadDeleteForm");
    const message = $("deleteMessage");
    const preview = $("deletePreview");
    const confirmButton = $("confirmDelete");

    let currentBook = null;

    loadForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        currentBook = null;
        preview.hidden = true;
        showMessage(message, "Looking for book...", "info");

        try {
            const book = await getBook($("deleteId").value.trim());
            currentBook = book;

            $("deleteTitle").textContent = book.title;
            $("deleteDetails").innerHTML = bookDetailsHTML(book);
            preview.hidden = false;

            showMessage(message, `Book #${book.id} found. Review the details below.`, "success");
        } catch (error) {
            showMessage(message, error.message, "error");
        }
    });

    confirmButton.addEventListener("click", async () => {
        if (!currentBook) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete "${currentBook.title}"?`
        );

        if (!confirmed) return;

        confirmButton.disabled = true;
        confirmButton.textContent = "Deleting...";

        try {
            const result = await request(`${API}/${currentBook.id}`, {
                method: "DELETE"
            });

            preview.hidden = true;
            $("deleteId").value = "";
            currentBook = null;
            showMessage(message, result.message, "success");
        } catch (error) {
            showMessage(message, error.message, "error");
        } finally {
            confirmButton.disabled = false;
            confirmButton.textContent = "Delete This Book";
        }
    });
}

// Start only the code needed for the current page
document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;

    const pageInitializers = {
        home: initHome,
        add: initAdd,
        view: initView,
        update: initUpdate,
        search: initSearch,
        delete: initDelete
    };

    if (pageInitializers[page]) {
        pageInitializers[page]();
    }
});
