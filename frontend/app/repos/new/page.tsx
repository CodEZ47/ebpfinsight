"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBase } from "../../../lib/apiBase";

const API = getApiBase();

export default function NewRepo() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const submit = async (e: any) => {
    e.preventDefault();
    await fetch(`${API}/repos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, description, category }),
    });
    router.push("/repos");
  };

  return (
    <form onSubmit={submit} className="max-w-xl bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Add Repository</h1>
      <label className="block mb-2">Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border mb-4"
      />

      <label className="block mb-2">URL</label>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full p-2 border mb-4"
      />

      <label className="block mb-2">Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 border mb-4"
      />

      <label className="block mb-2">Category</label>
      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full p-2 border mb-4"
      />

      <button className="px-4 py-2 bg-blue-600 text-white rounded">
        Add Repo
      </button>
    </form>
  );
}
