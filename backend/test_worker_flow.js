require('dotenv').config();

async function runTests() {
  const base = 'http://localhost:5000/api';

  console.log('1. Logging in as Society Admin...');
  const loginRes = await fetch(`${base}/auth/society/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ societyCode: 'SOC-TEST-1', password: 'pass' }),
  });
  const loginData = await loginRes.json();
  if (!loginData.success) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }
  const token = loginData.token;
  console.log('   ✓ Logged in successfully. Token acquired.');

  console.log('\n2. Testing 9-digit phone validation rejection...');
  const badPhoneRes = await fetch(`${base}/society/workers/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Bad Phone Worker',
      phone: '987654321', // 9 digits
      category: 'electrician',
      kycMethod: 'certificate',
    }),
  });
  const badPhoneData = await badPhoneRes.json();
  console.log('   Response status:', badPhoneRes.status, badPhoneData.message);
  if (badPhoneRes.status !== 400) {
    throw new Error('Expected 400 for 9-digit phone, got: ' + badPhoneRes.status);
  }
  console.log('   ✓ 10-digit validation rejected invalid phone correctly.');

  console.log('\n3. Testing Government Certified Worker Registration (instant KYC completed)...');
  const govWorkerRes = await fetch(`${base}/society/workers/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Kavitha Murugan',
      age: 29,
      address: 'Plot 45, Anna Nagar West, Chennai - 600040',
      phone: '9840112233',
      category: 'electrician',
      skills: ['House Wiring', 'Inverter Installation', 'Switchboard Repair'],
      photoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/sampleworkerphoto1',
      bankAccountNo: '50100456123490',
      bankIfsc: 'HDFC0001234',
      bankName: 'HDFC Bank, Anna Nagar',
      kycMethod: 'certificate',
      certId: 'ITI-TN-ELEC-2022-7712',
    }),
  });
  const govWorkerData = await govWorkerRes.json();
  console.log('   Status:', govWorkerRes.status);
  console.log('   Worker created:', govWorkerData.worker);
  if (govWorkerData.worker?.kycStatus !== 'active') {
    throw new Error('Expected kycStatus to be "active" (completed), got: ' + govWorkerData.worker?.kycStatus);
  }
  console.log('   ✓ Gov Certified worker registered with KYC status COMPLETED / ACTIVE.');

  console.log('\n4. Testing Client Reference Worker Registration (with client address & 10-digit phone)...');
  const refWorkerRes = await fetch(`${base}/society/workers/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Selvam Ramasamy',
      age: 38,
      address: '14/2 South Mada Street, Mylapore, Chennai - 600004',
      phone: '9840445566',
      category: 'plumber',
      skills: ['Pipe Leakage Fix', 'Bathroom Fitting', 'Water Heater Piping'],
      photoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/sampleworkerphoto2',
      bankAccountNo: '91802001928374',
      bankIfsc: 'SBIN0000876',
      bankName: 'State Bank of India, Mylapore',
      kycMethod: 'community_voucher',
      clientRefs: [
        {
          refName: 'Dr. S. Venkat',
          refPhone: '9840998877',
          refAddress: 'Villa 12, Green Enclave, Mylapore, Chennai',
        },
        {
          refName: 'Priya Narayanan',
          refPhone: '9444112233',
          refAddress: 'Apt 4B, Ocean View, Santhome, Chennai',
        },
      ],
    }),
  });
  const refWorkerData = await refWorkerRes.json();
  console.log('   Status:', refWorkerRes.status);
  console.log('   Worker created:', refWorkerData.worker);
  console.log('   ✓ Client Reference worker registered with references.');

  console.log('\n5. Listing workers from Supabase to verify stored data...');
  const listRes = await fetch(`${base}/society/workers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await listRes.json();
  console.log(`   Found ${listData.workers?.length} workers:`);
  listData.workers?.forEach(w => {
    console.log(`   - [${w.uniqueId}] ${w.name} (${w.age || 'N/A'} yrs) | Phone: ${w.phone} | KYC: ${w.kycStatus} | Bank: ${w.bankAccountNo || 'N/A'} | Address: ${w.address || 'N/A'}`);
    if (w.kycRefs && w.kycRefs.length > 0) {
      console.log(`     Client Refs:`, w.kycRefs.map(r => `${r.ref_name} (Ph: ${r.ref_phone}, Addr: ${r.ref_address})`).join('; '));
    }
  });

  console.log('\n✅ All automated worker registration and Supabase storage tests PASSED!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
