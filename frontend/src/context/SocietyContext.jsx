import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { workersAPI, bookingsAPI, paymentsAPI, ratesAPI, welfareAPI, complaintsAPI, dashboardAPI } from '../services/api';

const SocietyContext = createContext(null);

export const SocietyProvider = ({ children }) => {
  const [society, setSociety] = useState({});
  const [workers, setWorkers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [rates, setRates] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [welfare, setWelfare] = useState({ enrollments: [], advances: [] });
  const [dashboard, setDashboard] = useState({ todayBookings: 0, todayEarnings: 0, weeklyEarnings: [] });
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
        /* Uncomment as endpoints are built
        payRes,
        rateRes,
        compRes,
        welfRes
        */
      ] = await Promise.all([
        dashboardAPI.getStats().catch(() => ({ data: { stats: {} } })),
        workersAPI.list().catch(() => ({ data: { workers: [] } })),
        bookingsAPI.list().catch(() => ({ data: { bookings: [] } })),
      ]);

      setDashboard(dashRes.data?.dashboard || dashRes.data?.stats || { todayBookings: 0, todayEarnings: 0, weeklyEarnings: [] });
      setWorkers(workRes.data.workers || []);
      setBookings(bookRes.data.bookings || []);
      
      // Default empty arrays for not-yet-implemented endpoints
      setPayments([]);
      setRates([]);
      setComplaints([]);
      setWelfare({ enrollments: [], advances: [] });
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
    // refresh bookings and payments...
  };

  const confirmSplitPayout = async (bookingId) => {
    await paymentsAPI.updateStatus(bookingId, { status: 'split_done' });
  };

  // ---- Rate Actions ----
  const updateRate = async (category, data) => {
    await ratesAPI.update(category, data);
  };

  // ---- Welfare Actions ----
  const enrollWorker = async (workerId, schemeId) => {
    // await welfareAPI.enrollWorker(workerId, schemeId);
  };

  const approveAdvance = async (advanceId) => {
    await welfareAPI.approveAdvance(advanceId);
  };

  // ---- Complaint Actions ----
  const resolveComplaint = async (id, resolution) => {
    await complaintsAPI.resolve(id, { resolution });
  };

  const escalateComplaint = async (id, reason) => {
    // await complaintsAPI.escalateToFederation(id, reason);
  };

  const addComplaintResponse = async (id, response) => {
    await complaintsAPI.respond(id, { response });
  };

  return (
    <SocietyContext.Provider value={{
      society, workers, bookings, payments, rates, complaints, welfare, dashboard,
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
      enrollWorker, approveAdvance,
      // Complaint
      resolveComplaint, escalateComplaint, addComplaintResponse,
      // Refresh
      refreshDashboard, refreshWorkers, refreshBookings, loadData
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
