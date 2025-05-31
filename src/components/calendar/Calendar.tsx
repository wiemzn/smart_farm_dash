"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  runTransaction,
} from "firebase/firestore";
import {
  ref as rtdbRef,
  set as rtdbSet,
  get as rtdbGet,
} from "firebase/database";
import { FaCheck, FaTimes } from "react-icons/fa";
import { db, rtdb } from "../../lib/firebase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

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
  ec: number;
}

export default function Requests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "requests"),
      (snapshot) => {
        const data: Request[] = snapshot.docs.map((doc) => {
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
            ec: (d.ec as number) || 0,
          };
        });
        setRequests(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching requests:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAccept = async (id: string) => {
    const request = requests.find((r) => r.id === id);
    if (!request || !request.authUid || !request.cin) {
      console.error("Invalid request or missing authUid/CIN");
      alert("Error: Invalid request or missing information");
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const clientRef = doc(db, "clients", request.authUid);
        const clientSnap = await transaction.get(clientRef);
        if (clientSnap.exists()) {
          throw new Error("Client already exists");
        }

        transaction.set(clientRef, {
          cin: request.cin,
          name: request.name,
          email: request.email,
          phone: request.phone,
          authUid: request.authUid,
          requestType: request.requestType,
          status: "approved",
          dateAccepted: new Date().toISOString(),
          ec: request.ec,
        });

        const requestRef = doc(db, "requests", id);
        transaction.delete(requestRef);
      });

      const refRtdb = rtdbRef(rtdb, `users/${request.authUid}`);
      const initialEc = request.ec || 0;
      await rtdbSet(refRtdb, {
        name: request.name,
        greenhouse: {
          humidity: 0,
          temperature: 0,
          water_level: 0,
          ph: 0,
          ec: initialEc,
          led: "OFF",
          ventilation: "OFF",
          water_pump: "OFF",
          air_pump: "OFF",
          control_mode: "MANUAL",
        },
        greenenergy: {
          daily_production: 0,
          energy_consumption: 0,
          stored_energy: 0,
        },
      });
      console.log('Written data to Firebase for user:', request.authUid, 'with ec:', initialEc);

      const snap = await rtdbGet(refRtdb);
      if (!snap.exists()) {
        throw new Error("Failed to write to Realtime Database");
      }
      console.log('Firebase data written and verified:', snap.val());

      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      console.error("Error during acceptance:", err);
      alert(`Error during acceptance: ${err.message}`);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await deleteDoc(doc(db, "requests", id));
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error during decline:", err);
      alert("Error declining the request");
    }
  };

  const formatDate = (isoDate: string) => {
    if (!isoDate || isoDate === "N/A") return "N/A";
    try {
      return new Date(isoDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoDate;
    }
  };

  const getBadgeColor = (status: string): "success" | "error" | "warning" => {
    switch (status.toLowerCase()) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "declined":
      default:
        return "error";
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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <h1 className="text-3xl font-semibold text-gray-800 dark:text-white mb-6">
            User Requests
          </h1>
          {requests.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">
              No pending requests.
            </p>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
              <Table className="w-full">
                <TableHeader className="border-b border-gray-200 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400 w-1/5"
                    >
                      User
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400 w-1/6"
                    >
                      CIN
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400 w-1/5"
                    >
                      Email
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400 w-1/6"
                    >
                      Phone
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400 w-1/8"
                    >
                      Request Type
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400 w-1/8"
                    >
                      Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400 w-1/8"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 font-medium text-gray-500 text-start text-sm dark:text-gray-400 w-1/8"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200 dark:divide-white/[0.05]">
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="px-4 py-4 text-start w-1/5">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="block font-medium text-gray-800 text-sm dark:text-white/[0.9]">
                              {r.name}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-3 text-gray-500 text-start text-sm dark:text-gray-400 w-1/6">
                        {r.cin}
                      </TableCell>
                      <TableCell className="px-1 py-3 text-gray-500 text-start text-sm dark:text-gray-400 break-all w-1/5">
                        {r.email}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-sm dark:text-gray-400 w-1/6">
                        {r.phone}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-sm dark:text-gray-400 w-1/8">
                        <Badge
                          size="sm"
                          color={r.requestType === "signup" ? "success" : "primary"}
                        >
                          {r.requestType}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-sm dark:text-gray-400 w-1/8">
                        {formatDate(r.date)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-sm dark:text-gray-400 w-1/8">
                        <Badge size="badge" color={getBadgeColor(r.status)}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 w-40">
                        <div className="flex gap-2">
                          <button
                            className="p-2 text-teal-500 hover:bg-teal-100 rounded-full disabled:opacity-50"
                            onClick={() => handleAccept(r.id)}
                            disabled={r.status !== "pending"}
                            title="Accept"
                          >
                            <FaCheck className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-red-500 hover:bg-red-100 rounded-full disabled:opacity-50"
                            onClick={() => handleDecline(r.id)}
                            disabled={r.status !== "pending"}
                            title="Decline"
                          >
                            <FaTimes className="h-5 w-5" />
                          </button>
                        </div>
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