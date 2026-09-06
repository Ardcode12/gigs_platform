import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { workersAPI, bookingsAPI, paymentsAPI, ratesAPI, welfareAPI, complaintsAPI, dashboardAPI } from '../services/api';

const SocietyContext = createContext(null);

export const SocietyProvider = ({ children, society: initialSociety = {} }) => {
  const [society] = useState(initialSociety);
  const [workers, setWorkers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [rates, setRates] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [welfare, setWelfare] = useState({ enrollments: [], advances: [] });
  const [dashboard, setDashboard] = useState({ todayBookings: 0, todayEarnings: 0, weeklyEarnings: [] });
  const [settings, setSettings] = useState({ emergencySurcharge: true, nightSurcharge: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---- Initial Load ----
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Just load what's implemented on the backend.
      // E.g. dashboard, workers, bookings, payments, rates, complaints, welfare
      const [
        dashRes,
        workRes,
        bookRes,
        payRes,
        rateRes,
        compRes,
         welfRes,
         settingsRes
      ] = await Promise.all([
        dashboardAPI.getStats(),
        workersAPI.list(),
        bookingsAPI.list(),
        paymentsAPI.list(),
        ratesAPI.list(),
        complaintsAPI.list(),
        welfareAPI.list(),
        dashboardAPI.getSettings(),
      ]);

      setDashboard(dashRes.data?.dashboard || dashRes.data?.stats || { todayBookings: 0, todayEarnings: 0, weeklyEarnings: [] });
      setWorkers(workRes.data.workers || []);
      setBookings(bookRes.data.bookings || []);
      setPayments(payRes.data.payments || []);
      setRates(rateRes.data.rates || []);
      setComplaints(compRes.data.complaints || []);
      setWelfare({ enrollments: welfRes.data.enrollments || [], advances: welfRes.data.advances || [] });
      setSettings(settingsRes.data.settings || settings);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- Refresh actions ----
  const refreshDashboard = useCallback(async () => {
    try { const res = await dashboardAPI.getStats(); setDashboard(res.data?.dashboard || res.data?.stats || {}); } catch (e) {}
  }, []);

  const refreshWorkers = useCallback(async () => {
    try { const res = await workersAPI.list(); setWorkers(res.data.workers || []); } catch (e) {}
  }, []);

  const refreshBookings = useCallback(async () => {
    try { const res = await bookingsAPI.list(); setBookings(res.data.bookings || []); } catch (e) {}
  }, []);

  const refreshPayments = useCallback(async () => {
    try { const res = await paymentsAPI.list(); setPayments(res.data.payments || []); } catch (e) {}
  }, []);

  const refreshWelfare = useCallback(async () => {
    try { const res = await welfareAPI.list(); setWelfare({ enrollments: res.data.enrollments || [], advances: res.data.advances || [] }); } catch (e) {}
  }, []);

  const refreshComplaints = useCallback(async () => {
    try { const res = await complaintsAPI.list(); setComplaints(res.data.complaints || []); } catch (e) {}
  }, []);

  const updateSettings = async (data) => {
    const res = await dashboardAPI.updateSettings(data);
    setSettings(res.data.settings || data);
  };

  // ---- Worker Actions ----
  const registerWorker = async (data) => {
    const res = await workersAPI.register(data);
    await refreshWorkers();
    return res.data.worker;
  };

  const submitKycRefs = async (workerId, data) => {
    const res = await workersAPI.submitRefs(workerId, data);
    await refreshWorkers();
    return res.data;
  };

  const approveKyc = async (workerId) => {
    await workersAPI.approveKyc(workerId);
    await refreshWorkers();
  };

  const rejectKyc = async (workerId, data) => {
    await workersAPI.rejectKyc(workerId, data);
    await refreshWorkers();
  };

  // ---- Booking Actions ----
  const assignWorker = async (bookingId, workerId) => {
    await bookingsAPI.assign(bookingId, { workerId });
    await refreshBookings();
    await refreshWorkers();
  };

  const assignBulkTeam = async (bookingId, workerIds, leadId) => {
    await bookingsAPI.assignBulk(bookingId, { workerIds, leadId });
    await refreshBookings();
  };

  const updateBookingStatus = async (bookingId, status) => {
    await bookingsAPI.updateStatus(bookingId, { status });
    await refreshBookings();
  };

  // ---- Payment Actions ----
  const recordCashPayment = async (bookingId, amount, workerId) => {
    await paymentsAPI.record({ bookingId, amount, workerId, mode: 'cash' });
    await refreshPayments();
  };

  const confirmSplitPayout = async (paymentId) => {
    await paymentsAPI.updateStatus(paymentId, { status: 'split_done' });
    await refreshPayments();
  };

  // ---- Rate Actions ----
  const updateRate = async (category, data) => {
    await ratesAPI.update(category, data);
    const res = await ratesAPI.list();
    setRates(res.data.rates || []);
  };

  // ---- Welfare Actions ----
  const enrollWorker = async (workerId, schemeId, data) => {
    await welfareAPI.enroll(workerId, schemeId, data);
    await refreshWelfare();
  };

  const approveAdvance = async (advanceId) => {
    await welfareAPI.approveAdvance(advanceId);
    await refreshWelfare();
  };

  const rejectAdvance = async (advanceId, reason) => {
    await welfareAPI.rejectAdvance(advanceId, { reason });
    await refreshWelfare();
  };

  const requestAdvance = async (workerId, amount, reason) => {
    await welfareAPI.requestAdvance({ workerId: Number(workerId), amount, reason });
    await refreshWelfare();
  };

  // ---- Complaint Actions ----
  const resolveComplaint = async (id, resolution) => {
    await complaintsAPI.resolve(id, { resolution });
    await refreshComplaints();
  };

  const escalateComplaint = async (id, reason) => {
    await complaintsAPI.escalate(id, { reason });
    await refreshComplaints();
  };

  const addComplaintResponse = async (id, response) => {
    await complaintsAPI.respond(id, { response });
    await refreshComplaints();
  };

  return (
    <SocietyContext.Provider value={{
       society, workers, bookings, payments, rates, complaints, welfare, dashboard, settings,
      loading, error,
      // Worker
      registerWorker, submitKycRefs, approveKyc, rejectKyc,
      // Booking
      assignWorker, assignBulkTeam, updateBookingStatus,
      // Payment
      recordCashPayment, confirmSplitPayout,
      // Rate
      updateRate,
      // Welfare
       enrollWorker, approveAdvance, rejectAdvance, requestAdvance,
      // Complaint
      resolveComplaint, escalateComplaint, addComplaintResponse,
      // Refresh
       refreshDashboard, refreshWorkers, refreshBookings, refreshPayments, refreshWelfare, refreshComplaints, updateSettings, loadData
    }}>
      {children}
    </SocietyContext.Provider>
  );
};

export const useSociety = () => {
  const ctx = useContext(SocietyContext);
  if (!ctx) throw new Error('useSociety must be used inside SocietyProvider');
  return ctx;
};
