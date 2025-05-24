"use client";

import React, { useState, useEffect } from "react";
import {
  getDocs,
  collection,
  setDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  ref as rtdbRef,
  set as rtdbSet,
  get as rtdbGet,
} from "firebase/database";
import { FaCheck, FaTimes } from "react-icons/fa";
import { db, rtdb } from "../../lib/firebase";
//import Sidebar from "../../components/Sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface Request {
  id: string;
  cin: string;
  name: string;
  email: string;
  phone: string;
  requestType: string;
  date: string;
  status: string;
  authUid: string;
}

export default function Requests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const snap = await getDocs(collection(db, "requests"));
        const data: Request[] = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            cin: (d.cin as string) || doc.id,
            name: (d.name as string) || "Unknown",
            email: (d.email as string) || "N/A",
            phone: (d.phone as string) || "N/A",
            requestType: (d.requestType as string) || "Unknown",
            date: (d.date as string) || "N/A",
            status: (d.status as string) || "pending",
            authUid: (d.authUid as string) || "",
          };
        });
        setRequests(data);
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleAccept = async (id: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    try {
      // Add to Firestore "clients"
      await setDoc(doc(db, "clients", req.cin), {
        cin: req.cin,
        name: req.name,
        email: req.email,
        phone: req.phone,
        authUid: req.authUid,
        requestType: req.requestType,
        status:"approved",
        dateAccepted: new Date().toISOString(),
      });
      // Initialize Realtime DB node
      const refRtdb = rtdbRef(rtdb, `users/${req.cin}`);
      await rtdbSet(refRtdb, {
        name: req.cin,
        greenhouse: { humidity: 0, temperature: 0, water_level: 0, ph: 0 , led:"off",ventilation:"off",water_pump
          :"off"},
        greenenergy: { stored_energy: 0, energy_consumption: 0 },
      });
      // verify write (optional)
      await new Promise((r) => setTimeout(r, 500));
      const snap = await rtdbGet(refRtdb);
      if (!snap.exists()) throw new Error("Realtime write failed");

      // Remove from "requests"
      await deleteDoc(doc(db, "requests", id));
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await deleteDoc(doc(db, "requests", id));
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Decline error:", err);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex">
        <div className="flex-1 p-4 sm:ml-64">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]"
  
    >
      <div className="max-w-full overflow-x-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <h1 className="text-3xl font-semibold text-gray-800 dark:text-white mb-6">
            Client Requests
          </h1>
          {requests.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">
              No requests found.
            </p>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <Table className="w-full">
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-1/5"
                    >
                      User
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-1/6"
                    >
                      CIN
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-1/5"
                    >
                      Email
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-1/6"
                    >
                      Phone
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-1/8"
                    >
                      Request Type
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-1/8"
                    >
                      Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-1/8"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-1/8"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="px-4 py-4 text-start w-1/5">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {r.name}
                            </span>
                          
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 w-1/6">
                        {r.cin}
                      </TableCell>
                      <TableCell className="px-1 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 break-all w-1/5">
                        {r.email}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 w-1/6">
                        {r.phone}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 w-1/8">
                        <Badge
                          size="sm"
                          color={
                            r.requestType === "signup"
                              ? "success"
                              : r.requestType === "accepted"
                              ? "warning"
                              : "error"
                          }
                        >
                          {r.requestType}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400 w-1/8">
                        {r.date}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 w-1/8">
                        <Badge
                          size="sm"
                          color={
                            r.status === "pending"
                              ? "warning"
                              : r.status === "approved"
                              ? "success"
                              : "error"
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 w-1/6">
                        <button
                          onClick={() => handleAccept(r.id)}
                          className="p-2 text-teal-500 hover:bg-teal-100 rounded-full"
                        >
                          <FaCheck className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDecline(r.id)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                        >
                          <FaTimes className="h-5 w-5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}