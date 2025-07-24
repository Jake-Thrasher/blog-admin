const blogUrl = "https://Jake-Thrasher.github.io/blog-data/blogData.json";

let posts = [];
let editingPostId = null;

const postsContainer = document.getElementById('postsContainer');
const postForm = document.getElementById('postForm');
const postModalLabel = document.getElementById('postModalLabel');
const postIdInput = document.getElementById('postId');
const postTitleInput = document.getElementById('postTitle');
const postDateInput = document.getElementById('postDate');
const postContentInput = document.getElementById('postContent');
const postTagsInput = document.getElementById('postTags');
const postModal = new bootstrap.Modal(document.getElementById('postModal'));
const addPostBtn = document.getElementById('addPostBtn');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');

const toastElement = document.getElementById('toast');
const toastBody = document.getElementById('toastBody');
const bsToast = new bootstrap.Toast(toastElement);

function showToast(message, type = 'success') {
  toastElement.className = `toast align-items-center text-bg-${type} border-0`;
  toastBody.textContent = message;
  bsToast.show();
}

function renderPosts(postsToRender) {
  postsContainer.innerHTML = '';
  if (postsToRender.length === 0) {
    postsContainer.innerHTML = '<p class="text-muted">No posts found.</p>';
    return;
  }

  postsToRender.forEach(post => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6';

    col.innerHTML = `
      <div class="card bg-secondary text-light">
        <div class="card-body">
          <h5 class="card-title">${post.title}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${post.date}</h6>
          <p class="card-text">${post.content}</p>
          <p><small>Tags: ${post.tags.join(', ')}</small></p>
          <button class="btn btn-sm btn-warning me-2" onclick="editPost(${post.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deletePost(${post.id})">Delete</button>
        </div>
      </div>
    `;

    postsContainer.appendChild(col);
  });
}

function sortPosts(postsArray, criteria) {
  const sorted = [...postsArray];
  switch (criteria) {
    case 'date-asc':
      sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case 'date-desc':
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
    case 'title-asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'title-desc':
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
  }
  return sorted;
}

async function fetchPosts() {
  try {
    const res = await fetch(blogUrl);
    posts = await res.json();
    applyFiltersAndRender();
  } catch (err) {
    console.error('Error fetching posts:', err);
    postsContainer.innerHTML = '<p class="text-danger">Failed to load posts.</p>';
  }
}

function resetForm() {
  postIdInput.value = '';
  postTitleInput.value = '';
  postDateInput.value = '';
  postContentInput.value = '';
  postTagsInput.value = '';
  editingPostId = null;
  postModalLabel.textContent = 'Add New Post';
}

addPostBtn.addEventListener('click', () => {
  resetForm();
});

postForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  await new Promise(resolve => setTimeout(resolve, 200));

  const id = editingPostId ?? Date.now();
  const newPost = {
    id,
    title: postTitleInput.value.trim(),
    date: postDateInput.value,
    content: postContentInput.value.trim(),
    tags: postTagsInput.value.split(',').map(t => t.trim()).filter(t => t)
  };

  if (editingPostId) {
    const index = posts.findIndex(p => p.id === editingPostId);
    if (index !== -1) posts[index] = newPost;
  } else {
    posts.push(newPost);
  }

  applyFiltersAndRender();

  postModal.hide();
  showToast(editingPostId ? 'Post updated!' : 'Post added!');
});

window.editPost = function (id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;

  editingPostId = id;
  postModalLabel.textContent = 'Edit Post';
  postIdInput.value = post.id;
  postTitleInput.value = post.title;
  postDateInput.value = post.date;
  postContentInput.value = post.content;
  postTagsInput.value = post.tags.join(', ');

  postModal.show();
};

window.deletePost = function (id) {
  posts = posts.filter(p => p.id !== id);
  applyFiltersAndRender();
  showToast('Post deleted!', 'danger');
};

function enableLiveUpdates() {
  let debounceTimeout;

  postForm.addEventListener('input', async (event) => {
    clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(async () => {
      if (editingPostId === null) return;

      const input = event.target;
      const index = posts.findIndex(p => p.id === editingPostId);
      if (index === -1) return;

      const updatedPost = { ...posts[index] };

      switch (input.id) {
        case 'postTitle':
          updatedPost.title = input.value.trim();
          break;
        case 'postDate':
          updatedPost.date = input.value;
          break;
        case 'postContent':
          updatedPost.content = input.value.trim();
          break;
        case 'postTags':
          updatedPost.tags = input.value.split(',').map(t => t.trim()).filter(t => t);
          break;
      }

      posts[index] = updatedPost;
      applyFiltersAndRender();
      showToast('Post updated (auto-save)', 'info');
    }, 300);
  });
}

let searchTimeout;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(applyFiltersAndRender, 300);
});

sortSelect.addEventListener('change', applyFiltersAndRender);

function applyFiltersAndRender() {
  const term = searchInput.value.toLowerCase();
  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(term) ||
    p.content.toLowerCase().includes(term) ||
    p.tags.some(t => t.toLowerCase().includes(term))
  );

  const sorted = sortPosts(filtered, sortSelect.value);
  renderPosts(sorted);
}

fetchPosts();
enableLiveUpdates();
