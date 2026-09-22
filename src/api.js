const BASE_URL = '/api';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return res.json();
}

export async function fetchProducts() {
  const res = await fetch(`${BASE_URL}/products`);
  return res.json();
}

export async function saveProduct(product) {
  const url = product.id ? `${BASE_URL}/products/${product.id}` : `${BASE_URL}/products`;
  const method = product.id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  return res.json();
}

export async function deleteProduct(id) {
  const res = await fetch(`${BASE_URL}/products/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function fetchIngredients() {
  const res = await fetch(`${BASE_URL}/ingredients`);
  return res.json();
}

export async function saveIngredient(ingredient) {
  const url = ingredient.id ? `${BASE_URL}/ingredients/${ingredient.id}` : `${BASE_URL}/ingredients`;
  const method = ingredient.id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ingredient),
  });
  return res.json();
}

export async function deleteIngredient(id) {
  const res = await fetch(`${BASE_URL}/ingredients/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function fetchPurchases() {
  const res = await fetch(`${BASE_URL}/purchases`);
  return res.json();
}

export async function createPurchase(purchaseData) {
  const res = await fetch(`${BASE_URL}/purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchaseData),
  });
  return res.json();
}

export async function fetchSales() {
  const res = await fetch(`${BASE_URL}/sales`);
  return res.json();
}

export async function createSale(saleData) {
  const res = await fetch(`${BASE_URL}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData),
  });
  return res.json();
}

export async function deleteSale(id) {
  const res = await fetch(`${BASE_URL}/sales/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function fetchMutations() {
  const res = await fetch(`${BASE_URL}/inventory/mutations`);
  return res.json();
}

export async function createMutation(mutData) {
  const res = await fetch(`${BASE_URL}/inventory/mutations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mutData),
  });
  return res.json();
}

export async function submitStockOpname(opnameData) {
  const res = await fetch(`${BASE_URL}/inventory/opname`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opnameData),
  });
  return res.json();
}

export async function fetchSummary(range = 'today') {
  const res = await fetch(`${BASE_URL}/summary?range=${range}`);
  return res.json();
}

export async function fetchGoogleConfig() {
  const res = await fetch(`${BASE_URL}/config`);
  return res.json();
}

export async function saveGoogleConfig(config) {
  const res = await fetch(`${BASE_URL}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return res.json();
}

export async function testGoogleConnection(data) {
  const res = await fetch(`${BASE_URL}/config/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function triggerSync() {
  const res = await fetch(`${BASE_URL}/sync`, { method: 'POST' });
  return res.json();
}

export async function uploadServiceAccountKey(file) {
  const formData = new FormData();
  formData.append('serviceAccountJson', file);
  const res = await fetch(`${BASE_URL}/config/upload-key`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
}
