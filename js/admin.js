import { supabase } from './lib/supabaseClient.js';
import { localProductList } from './products.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen Navigasi & Halaman ---
    const sidebar = document.getElementById('sidebar');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const navLinks = document.querySelectorAll('.nav-link');
    const pageTitle = document.getElementById('page-title');
    const pages = document.querySelectorAll('.page-content');

    // --- Elemen Inventaris & Produk---
    const itemsTableBody = document.getElementById('items-table-body');
    const addProductBtn = document.getElementById('add-product-btn');
    const exportInventoryBtn = document.getElementById('export-inventory-btn');
    const checkStockNotificationBtn = document.getElementById('check-stock-notification-btn');
    
    // Modal Edit Stok
    const itemFormModal = document.getElementById('item-form-modal');
    const itemForm = document.getElementById('item-form');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.querySelector('.cancel-btn');
    const modalProductName = document.getElementById('modal-product-name');
    const modalProductImage = document.getElementById('modal-product-image');

    // Modal Tambah Produk
    const productFormModal = document.getElementById('product-form-modal');
    const productForm = document.getElementById('product-form');
    const productCloseBtn = document.querySelector('.product-close-btn');
    const productCancelBtn = document.querySelector('.product-cancel-btn');

    // --- Elemen Keuangan ---
    const totalPendapatanEl = document.getElementById('total-pendapatan');
    const totalPengeluaranEl = document.getElementById('total-pengeluaran');
    const totalKeuntunganEl = document.getElementById('total-keuntungan');
    const lastUpdateEl = document.getElementById('last-update');
    const transactionsTableBody = document.getElementById('transactions-table-body');
    const financeChartCanvas = document.getElementById('finance-chart');
    const exportTransactionsBtn = document.getElementById('export-transactions-btn');

    // --- State Aplikasi ---
    let masterProductList = [];
    let currentInventory = [];
    let currentTransactions = [];
    let financeChart = null;
    
    // ===============================================
    // --- FUNGSI-FUNGSI UTAMA ---
    // ===============================================

    const toggleSidebar = () => {
        if (sidebar && sidebarOverlay) {
            sidebar.classList.toggle('-translate-x-full');
            sidebarOverlay.classList.toggle('hidden');
        }
    };

    const navigateTo = (hash) => {
        if(pages) pages.forEach(page => page.classList.add('hidden'));
        if(navLinks) navLinks.forEach(link => link.classList.remove('bg-gray-900'));
        const targetPage = document.querySelector(hash + '-view');
        const targetLink = document.querySelector(`.nav-link[href="${hash}"]`);
        if (targetPage) targetPage.classList.remove('hidden');
        if (targetLink && pageTitle) {
            targetLink.classList.add('bg-gray-900');
            pageTitle.textContent = targetLink.textContent.trim();
        }
        if (window.innerWidth < 768) {
            toggleSidebar();
        }
    };
    
    const openStockModal = (item) => {
        const product = masterProductList.find(p => p.id == item.product_id && p.source === item.product_source);
        if (!product || !itemForm) return;

        itemForm.reset();
        modalProductName.textContent = product.name;
        modalProductImage.src = product.image_url;
        
        document.getElementById('item-id').value = item.id || '';
        document.getElementById('product-id').value = item.product_id;
        document.getElementById('product-source').value = product.source;
        document.getElementById('item-stock-grosir').value = item.stock_grosir || 0;
        document.getElementById('item-unit-grosir').value = item.unit_grosir || '';
        document.getElementById('item-stock-eceran').value = item.stock_eceran || 0;
        document.getElementById('item-unit-eceran').value = item.unit_eceran || '';
        document.getElementById('item-harga-grosir').value = item.harga_grosir || 0;
        document.getElementById('item-harga-eceran').value = item.harga_eceran || 0;
        document.getElementById('item-isi-per-grosir').value = item.isi_per_grosir || 1;
        document.getElementById('item-tanggal-kadaluarsa').value = item.tanggal_kadaluarsa || '';

        if (itemFormModal) itemFormModal.classList.remove('hidden');
    };

    const closeStockModal = () => {
        if (itemFormModal) itemFormModal.classList.add('hidden');
    };

    const openProductModal = () => {
        if(productForm) productForm.reset();
        if(productFormModal) productFormModal.classList.remove('hidden');
    };
    
    const closeProductModal = () => {
        if(productFormModal) productFormModal.classList.add('hidden');
    };

    const renderInventoryView = () => {
        if (!itemsTableBody) return;
        itemsTableBody.innerHTML = '';

        masterProductList.sort((a,b) => a.name.localeCompare(b.name)).forEach(product => {
            const inventoryItem = currentInventory.find(item => item.product_id == product.id && item.product_source === product.source);
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';
            const stockGrosir = inventoryItem ? `${inventoryItem.stock_grosir} ${inventoryItem.unit_grosir || ''}` : '<span class="text-gray-400">-</span>';
            const stockEceran = inventoryItem ? `${inventoryItem.stock_eceran} ${inventoryItem.unit_eceran || ''}` : '<span class="text-gray-400">-</span>';
            const tglKadaluarsa = inventoryItem ? inventoryItem.tanggal_kadaluarsa || '<span class="text-gray-400">-</span>' : '<span class="text-gray-400">Belum diatur</span>';

            row.innerHTML = `
                <td class="py-3 px-4"><div class="flex items-center"><img src="${product.image_url || 'https://placehold.co/40x40'}" alt="${product.name}" class="w-10 h-10 rounded-full object-cover mr-4"><span class="font-medium">${product.name}</span></div></td>
                <td class="py-3 px-4">${stockGrosir}</td>
                <td class="py-3 px-4">${stockEceran}</td>
                <td class="py-3 px-4">${tglKadaluarsa}</td>
                <td class="py-3 px-4"><button class="edit-btn text-blue-600 hover:underline" data-product-id="${product.id}" data-product-source="${product.source}">${inventoryItem ? 'Edit Stok' : 'Atur Stok'}</button></td>
            `;
            itemsTableBody.appendChild(row);
        });
    };

    const renderFinanceView = () => {
        if (!totalPendapatanEl || !transactionsTableBody) return;
        const totalPendapatan = currentTransactions.filter(t => t.tipe === 'pendapatan').reduce((sum, t) => sum + t.total_harga, 0);
        const totalPengeluaran = currentTransactions.filter(t => t.tipe === 'pengeluaran').reduce((sum, t) => sum + t.total_harga, 0);
        const keuntungan = totalPendapatan - totalPengeluaran;
        totalPendapatanEl.textContent = `Rp ${new Intl.NumberFormat('id-ID').format(totalPendapatan)}`;
        totalPengeluaranEl.textContent = `Rp ${new Intl.NumberFormat('id-ID').format(totalPengeluaran)}`;
        totalKeuntunganEl.textContent = `Rp ${new Intl.NumberFormat('id-ID').format(keuntungan)}`;
        totalKeuntunganEl.className = `text-3xl font-bold mt-2 ${keuntungan >= 0 ? 'text-blue-500' : 'text-red-500'}`;
        if (currentTransactions.length > 0) {
            const lastDate = new Date(currentTransactions[0].created_at);
            lastUpdateEl.textContent = lastDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        } else {
            lastUpdateEl.textContent = '-';
        }
        transactionsTableBody.innerHTML = '';
        currentTransactions.forEach(trx => {
            const row = document.createElement('tr');
            const isPendapatan = trx.tipe === 'pendapatan';
            row.className = 'border-b';
            row.innerHTML = `
                <td class="py-3 px-4 text-sm">${new Date(trx.created_at).toLocaleString('id-ID')}</td>
                <td class="py-3 px-4"><span class="px-2 py-1 text-xs rounded-full font-semibold ${isPendapatan ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${trx.tipe}</span></td>
                <td class="py-3 px-4 text-sm">${trx.deskripsi}</td>
                <td class="py-3 px-4 text-right font-medium text-sm ${isPendapatan ? 'text-green-600' : 'text-red-600'}">${isPendapatan ? '+' : '-'} Rp ${new Intl.NumberFormat('id-ID').format(trx.total_harga)}</td>
            `;
            transactionsTableBody.appendChild(row);
        });
        renderFinanceChart();
    };
    
    const renderFinanceChart = () => {
        if (financeChart) financeChart.destroy();
        if (!financeChartCanvas) return;
        const labels = [], incomeData = [], expenseData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            labels.push(d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));
            incomeData.push(0); expenseData.push(0);
        }
        currentTransactions.forEach(trx => {
            const trxDate = new Date(trx.created_at), today = new Date(), sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);
            if (trxDate >= sevenDaysAgo && trxDate <= today) {
                const label = trxDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                const index = labels.indexOf(label);
                if (index !== -1) {
                    if (trx.tipe === 'pendapatan') incomeData[index] += trx.total_harga;
                    else expenseData[index] += trx.total_harga;
                }
            }
        });
        const ctx = financeChartCanvas.getContext('2d');
        financeChart = new Chart(ctx, { type: 'bar', data: { labels, datasets: [ { label: 'Pendapatan', data: incomeData, backgroundColor: 'rgba(75, 192, 192, 0.6)' }, { label: 'Pengeluaran', data: expenseData, backgroundColor: 'rgba(255, 99, 132, 0.6)' } ] }, options: { scales: { y: { beginAtZero: true } } } });
    };

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: dbProducts, error: productError } = await supabase.from('products').select('*').eq('user_id', user.id);
        if (productError) return console.error('Error fetching db products:', productError);
        const localProductsWithSource = localProductList.map(p => ({ ...p, source: 'local' }));
        const dbProductsWithSource = dbProducts.map(p => ({ ...p, source: 'db' }));
        masterProductList = [...localProductsWithSource, ...dbProductsWithSource];
        const { data: inventoryData, error: inventoryError } = await supabase.from('items').select('*').eq('user_id', user.id);
        if (inventoryError) return console.error('Error fetching inventory:', inventoryError);
        currentInventory = inventoryData;
        const { data: transactionData, error: transactionError } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (transactionError) return console.error('Error fetching transactions:', transactionError);
        currentTransactions = transactionData;
        renderInventoryView();
        renderFinanceView();
    };

    const handleStockFormSubmit = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alert('Sesi tidak valid.');
        const itemId = document.getElementById('item-id').value;
        const productId = document.getElementById('product-id').value;
        const productSource = document.getElementById('product-source').value;
        const newData = {
            product_id: productId, product_source: productSource, user_id: user.id,
            stock_grosir: parseFloat(document.getElementById('item-stock-grosir').value), unit_grosir: document.getElementById('item-unit-grosir').value,
            stock_eceran: parseFloat(document.getElementById('item-stock-eceran').value), unit_eceran: document.getElementById('item-unit-eceran').value,
            harga_grosir: parseFloat(document.getElementById('item-harga-grosir').value), harga_eceran: parseFloat(document.getElementById('item-harga-eceran').value),
            isi_per_grosir: parseInt(document.getElementById('item-isi-per-grosir').value) || 1,
            tanggal_kadaluarsa: document.getElementById('item-tanggal-kadaluarsa').value,
        };
        const saveButton = itemForm.querySelector('button[type="submit"]');
        saveButton.disabled = true;
        saveButton.textContent = 'Menyimpan...';
        try {
            const oldItem = currentInventory.find(item => item.id == itemId);
            const transactionsToInsert = [];
            if (oldItem) {
                const oldTotalEceran = (oldItem.stock_grosir * oldItem.isi_per_grosir) + oldItem.stock_eceran;
                const newTotalEceran = (newData.stock_grosir * newData.isi_per_grosir) + newData.stock_eceran;
                const diff = newTotalEceran - oldTotalEceran;
                if (diff < 0) transactionsToInsert.push({ user_id: user.id, item_id: itemId, product_id: productId, tipe: 'pendapatan', deskripsi: `Penjualan ${Math.abs(diff)} ${newData.unit_eceran}`, jumlah: Math.abs(diff), total_harga: Math.abs(diff) * newData.harga_eceran });
                else if (diff > 0) transactionsToInsert.push({ user_id: user.id, item_id: itemId, product_id: productId, tipe: 'pengeluaran', deskripsi: `Penambahan stok ${diff} ${newData.unit_eceran}`, jumlah: diff, total_harga: diff * (newData.harga_grosir / newData.isi_per_grosir) });
                const { error: updateError } = await supabase.from('items').update(newData).eq('id', itemId);
                if (updateError) throw updateError;
            } else {
                const { data: newItem, error: insertError } = await supabase.from('items').insert(newData).select().single();
                if (insertError) throw insertError;
                const totalModal = newData.stock_grosir * newData.harga_grosir;
                if (totalModal > 0) transactionsToInsert.push({ user_id: user.id, item_id: newItem.id, product_id: productId, tipe: 'pengeluaran', deskripsi: 'Modal stok awal', jumlah: newData.stock_grosir, total_harga: totalModal });
            }
            if (transactionsToInsert.length > 0) {
                const { error: trxError } = await supabase.from('transactions').insert(transactionsToInsert);
                if (trxError) throw trxError;
            }
            closeStockModal();
            fetchData();
        } catch (error) {
            console.error('Error saving item:', error);
            alert(`Gagal menyimpan: ${error.message}`);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Simpan Perubahan';
        }
    };
    
    const handleProductFormSubmit = async (e) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alert('Sesi tidak valid.');
        const name = document.getElementById('product-name').value;
        const imageFile = document.getElementById('product-image').files[0];
        const saveButton = productForm.querySelector('button[type="submit"]');
        saveButton.disabled = true;
        saveButton.textContent = 'Menyimpan...';
        try {
            const filePath = `${user.id}/products/${Date.now()}-${imageFile.name}`;
            const { error: uploadError } = await supabase.storage.from('item_images').upload(filePath, imageFile);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('item_images').getPublicUrl(filePath);
            const { error: insertError } = await supabase.from('products').insert({ name: name, image_url: urlData.publicUrl, user_id: user.id });
            if (insertError) throw insertError;
            closeProductModal();
            fetchData();
        } catch (error) {
            console.error('Error saving product:', error);
            alert(`Gagal menyimpan produk: ${error.message}`);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Simpan Produk';
        }
    };
    
    // --- FUNGSI EXPORT & NOTIFIKASI ---
    const exportToCSV = (headers, data, filename) => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + data.map(row => row.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportInventory = () => {
        const headers = ["Nama Produk", "Stok Grosir", "Unit Grosir", "Stok Eceran", "Unit Eceran", "Tgl Kadaluarsa"];
        const data = masterProductList.map(product => {
            const item = currentInventory.find(i => i.product_id == product.id && i.product_source === product.source) || {};
            return [`"${product.name}"`, item.stock_grosir || 0, item.unit_grosir || '-', item.stock_eceran || 0, item.unit_eceran || '-', item.tanggal_kadaluarsa || '-'];
        });
        exportToCSV(headers, data, `laporan_stok_${new Date().toISOString().split('T')[0]}.csv`);
    };
    
    const handleExportTransactions = () => {
        const headers = ["Tanggal", "Tipe", "Deskripsi", "Total Harga"];
        const data = currentTransactions.map(trx => [`"${new Date(trx.created_at).toLocaleString('id-ID')}"`, trx.tipe, `"${trx.deskripsi}"`, trx.total_harga]);
        exportToCSV(headers, data, `laporan_transaksi_${new Date().toISOString().split('T')[0]}.csv`);
    };
    
    const runStockNotificationCheck = () => {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const lowStockItems = currentInventory.filter(item => {
            const totalEceran = (item.stock_grosir * item.isi_per_grosir) + item.stock_eceran;
            return totalEceran < 10;
        });
        const expiringItems = currentInventory.filter(item => {
            if (!item.tanggal_kadaluarsa) return false;
            return new Date(item.tanggal_kadaluarsa) <= sevenDaysFromNow;
        });
        console.clear();
        console.log("===== 🚨 SIMULASI NOTIFIKASI STOK 🚨 =====");
        if (lowStockItems.length === 0 && expiringItems.length === 0) {
            console.log("✅ Semua stok aman dan tidak ada yang mendekati kadaluarsa.");
            alert("Semua stok aman!");
            return;
        }
        if (lowStockItems.length > 0) {
            console.log("\n--- 📉 BARANG STOK MENIPIS (<10 Eceran) ---");
            lowStockItems.forEach(item => {
                const product = masterProductList.find(p => p.id == item.product_id && p.source === item.product_source);
                if(product) console.log(`- ${product.name} (Sisa: ${item.stock_eceran} ${item.unit_eceran})`);
            });
        }
        if (expiringItems.length > 0) {
            console.log("\n--- ⏳ BARANG SEGERA KADALUARSA (<= 7 Hari) ---");
            expiringItems.forEach(item => {
                const product = masterProductList.find(p => p.id == item.product_id && p.source === item.product_source);
                if(product) console.log(`- ${product.name} (Tgl: ${item.tanggal_kadaluarsa})`);
            });
        }
        console.log("==========================================");
        alert("Ditemukan item yang butuh perhatian. Silakan cek console (F12) untuk detail.");
    };

    // --- EVENT LISTENERS ---
    if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);
    navLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); navigateTo(e.target.hash); }); });
    if (itemsTableBody) {
        itemsTableBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn')) {
                const productId = e.target.dataset.productId;
                const productSource = e.target.dataset.productSource;
                const inventoryItem = currentInventory.find(item => item.product_id == productId && item.product_source === productSource) || { product_id: productId, product_source: productSource };
                openStockModal(inventoryItem);
            }
        });
    }
    if(itemForm) itemForm.addEventListener('submit', handleStockFormSubmit);
    if(closeBtn) closeBtn.addEventListener('click', closeStockModal);
    if(cancelBtn) cancelBtn.addEventListener('click', closeStockModal);
    if(itemFormModal) window.addEventListener('click', (e) => { if (e.target === itemFormModal) closeStockModal() });
    if (addProductBtn) addProductBtn.addEventListener('click', openProductModal);
    if (productCloseBtn) productCloseBtn.addEventListener('click', closeProductModal);
    if (productCancelBtn) productCancelBtn.addEventListener('click', closeProductModal);
    if (productForm) productForm.addEventListener('submit', handleProductFormSubmit);
    if (exportInventoryBtn) exportInventoryBtn.addEventListener('click', handleExportInventory);
    if (exportTransactionsBtn) exportTransactionsBtn.addEventListener('click', handleExportTransactions);
    if (checkStockNotificationBtn) checkStockNotificationBtn.addEventListener('click', runStockNotificationCheck);

    // --- Inisialisasi ---
    const initialHash = window.location.hash || '#inventory';
    navigateTo(initialHash);
    fetchData();
});

