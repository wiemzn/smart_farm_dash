"use client";

import React, { useState, useEffect } from "react";
import { deleteDoc, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { ref as rtdbRef, set as rtdbSet, remove } from "firebase/database";
import { db, rtdb } from "../../lib/firebase";
import { FaPen, FaTrash } from "react-icons/fa";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
//import { Input } from "@/components/ui/input"

import Label from "../form/Label";

//import { PencilIcon, TrashIcon } from "@heroicons/react/outline";

//import Sidebar from "../../../components/Sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Image from "next/image";

interface Client {
  id: string;
  name: string;
  email: string;
  cin: string;
  requestType: string;
  dateAccepted: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", cin:"" });
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);
  const { isOpen, openModal, closeModal } = useModal();
  

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "clients"));
        const clientData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Client[];
        setClients(clientData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching clients:", error);
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleEdit = (client: Client) => {
    setEditing(client.id);
    setFormData({ name: client.name, email: client.email , cin:client.cin});
    openModal(); // ← important
  };
  

  const handleSave = async (clientId: string) => {
    try {
      // Update Firestore
      await updateDoc(doc(db, "clients", clientId), {
        name: formData.name,
        email: formData.email,
      });

      // Update Realtime Database
      const userRef = rtdbRef(rtdb, `users/${clientId}/name`);
      await rtdbSet(userRef, formData.name);

      // Update local state
      setClients((prev) =>
        prev.map((client) =>
          client.id === clientId ? { ...client, name: formData.name, email: formData.email } : client
        )
      );
      setEditing(null);
      setNotification({ type: "success", message: "Client updated successfully" });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ type: "error", message: `Failed to update client: ${error}` });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDelete = async (clientId: string) => {
    try {
      // Supprimer de Firestore
      await deleteDoc(doc(db, "clients", clientId));
      console.log("Deleted from Firestore:", clientId);
  
      // Supprimer de Realtime Database
      const userRef = rtdbRef(rtdb, `users/${clientId}`);
      await remove(userRef);
      console.log("Deleted from Realtime Database:", clientId);
  
      // Mettre à jour le state local
      setClients((prev) => prev.filter((client) => client.id !== clientId));
  
      setNotification({ type: "success", message: "Client supprimé avec succès" });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      console.error("Erreur lors de la suppression du client:", error.message);
      setNotification({ type: "error", message: `Échec de la suppression : ${error.message}` });
      setTimeout(() => setNotification(null), 3000);
    }
  };
  type BadgeVariant = "primary" | "secondary" | "outline" | "solid";


  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1102px]">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Client Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Email
                </TableCell>
                
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
CIN                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
Date                </TableCell>
<TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
Actions                </TableCell>

              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {clients.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-3">
                    
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {order.name}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {order.email}
                  </TableCell>
                
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                {order.cin}



                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {order.dateAccepted}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                  <button
  onClick={() => handleEdit(order)}
  className="p-2 text-blue-500 hover:bg-blue-100 rounded-full"
>
  <FaPen className="h-5 w-5" />
</button>
<button
  onClick={() => handleDelete(order.id)}
  className="p-2 text-red-500 hover:bg-red-100 rounded-full"
>
  <FaTrash className="h-5 w-5" />
</button>
</TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
          {editing && (
    <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
    <div className="no-scrollbar relative w-full max-w-[700px] h-[550px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
    <div className="px-2 pr-14 py-2">
    <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Edit Personal Information
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
          Update your client details .
        </p>
      </div>
      <form className="flex flex-col">
  <div className="custom-scrollbar h-[270px] overflow-y-auto px-2 pb-3">
    <div>
      {/* Utilisation d'une grille avec une seule colonne */}
      <div className="grid grid-cols-1 gap-y-5">
      
        <div>
          <Label>Name</Label>
          <Input
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label>Email</Label>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label>cin</Label>
          <Input
            name="cin"
            type="text"
            value={formData.cin}
            onChange={handleInputChange}
          />
        </div>

      </div>
    </div>
  </div>

  <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
    <Button size="sm" variant="outline" onClick={closeModal}>
      Close
    </Button>
    <Button onClick={() => handleSave(editing!)}>Save</Button>
  </div>
</form>

    </div>
  </Modal>
)}

        </div>
      </div>
    </div>
  );
}
