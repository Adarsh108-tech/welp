"use client";
import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";

export default function Dashboard() {
  const [collections, setCollections] = useState(["Work", "Personal"]);
  const [activeCollection, setActiveCollection] = useState("Work");
  const [editingTitle, setEditingTitle] = useState(null);
  const [subTasks, setSubTasks] = useState({
    Work: [{ id: 1, desc: "Finish report", done: false }],
    Personal: [{ id: 1, desc: "Call plumber", done: false }],
  });
  const [deletingTasks, setDeletingTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  const modalRef = useRef();

  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setShowModal(false);
      setNewCollectionName("");
    }
  };

  useEffect(() => {
    if (showModal) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showModal]);

  const addCollection = () => setShowModal(true);

  const confirmAddCollection = () => {
    const name = newCollectionName.trim();
    if (name && !collections.includes(name)) {
      setCollections([...collections, name]);
      setSubTasks({ ...subTasks, [name]: [] });
      setActiveCollection(name);
    }
    setNewCollectionName("");
    setShowModal(false);
  };

  const deleteCollection = (name) => {
    const updatedCollections = collections.filter((col) => col !== name);
    const updatedSubTasks = { ...subTasks };
    delete updatedSubTasks[name];

    setCollections(updatedCollections);
    setSubTasks(updatedSubTasks);

    if (activeCollection === name && updatedCollections.length > 0) {
      setActiveCollection(updatedCollections[0]);
    } else if (updatedCollections.length === 0) {
      setActiveCollection("");
    }
  };

  const addSubTask = () => {
    const newId = Date.now();
    setSubTasks({
      ...subTasks,
      [activeCollection]: [
        ...subTasks[activeCollection],
        { id: newId, desc: "", done: false },
      ],
    });
  };

  const updateSubTask = (id, field, value) => {
    const updated = subTasks[activeCollection].map((task) =>
      task.id === id ? { ...task, [field]: value } : task
    );
    setSubTasks({ ...subTasks, [activeCollection]: updated });
  };

  const handleCheckSubTask = (id) => {
    setDeletingTasks((prev) => [...prev, id]);
    setTimeout(() => {
      const updated = subTasks[activeCollection].filter((task) => task.id !== id);
      setSubTasks({ ...subTasks, [activeCollection]: updated });
      setDeletingTasks((prev) => prev.filter((taskId) => taskId !== id));
    }, 300);
  };

  const renameCollection = (oldName, newName) => {
    if (!newName.trim() || collections.includes(newName)) return;

    const updatedCollections = collections.map((col) =>
      col === oldName ? newName : col
    );
    const updatedSubTasks = { ...subTasks };
    updatedSubTasks[newName] = updatedSubTasks[oldName];
    delete updatedSubTasks[oldName];

    setCollections(updatedCollections);
    setSubTasks(updatedSubTasks);
    if (activeCollection === oldName) setActiveCollection(newName);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative">
      <Navbar />

      {/* Tabs Navbar */}
      <div className="mt-[3.25rem] flex items-center px-4 space-x-2 overflow-x-auto border-b pb-2">
        {collections.map((name) => (
          <div
            key={name}
            className={`flex items-center px-2 rounded-lg ${
              activeCollection === name
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {editingTitle === name ? (
              <input
                autoFocus
                className="px-2 py-1 rounded-md text-black"
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  setCollections((prev) =>
                    prev.map((col) => (col === name ? val : col))
                  );
                }}
                onBlur={() => {
                  setEditingTitle(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    renameCollection(name, e.target.value.trim());
                    setEditingTitle(null);
                  }
                }}
              />
            ) : (
              <button
                onDoubleClick={() => setEditingTitle(name)}
                onClick={() => setActiveCollection(name)}
                className="px-3 py-2 focus:outline-none"
              >
                {name}
              </button>
            )}
            <button
              onClick={() => deleteCollection(name)}
              className="text-sm px-2 text-white bg-slate-700 hover:bg-red-800 rounded-full"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={addCollection}
          className="text-white bg-blue-600 text-2xl px-2 hover:bg-blue-800 rounded-full"
        >
          +
        </button>
      </div>

      {/* SubTasks Section */}
      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        {activeCollection && (
          <>
            <h2 className="text-2xl font-semibold text-blue-700">
              {activeCollection} Tasks
            </h2>
            <button
              onClick={addSubTask}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              + Add Subtask
            </button>

            <div className="space-y-4 mt-4">
              {subTasks[activeCollection]?.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center bg-white shadow p-3 rounded-md transform transition duration-300 ease-in-out ${
                    deletingTasks.includes(task.id)
                      ? "opacity-0 scale-95"
                      : "opacity-100 scale-100"
                  }`}
                >
                  <div className="w-1/5">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => handleCheckSubTask(task.id)}
                      className="w-5 h-5 text-blue-600"
                    />
                  </div>
                  <div className="w-4/5">
                    <input
                      type="text"
                      value={task.desc}
                      onChange={(e) =>
                        updateSubTask(task.id, "desc", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-blue-500"
                      placeholder="Enter subtask description..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!activeCollection && (
          <div className="text-center text-gray-500 mt-10">
            No task collection selected. Create a new one!
          </div>
        )}
      </div>

      {/* Modal for New Collection */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div ref={modalRef} className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">New Collection</h3>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded-md mb-4"
              placeholder="Enter collection name..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmAddCollection();
              }}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewCollectionName("");
                }}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddCollection}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
