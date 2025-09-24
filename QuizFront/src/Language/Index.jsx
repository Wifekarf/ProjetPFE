import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import AuthLayout from "../Layout/AuthLayout";

export default function Language() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    icon: "",
    color: "#000000"
  });
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchLanguages = async () => {
    try {
      const response = await api.get("/api/langages");
      setLanguages(response.data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/langages/create", formData);
      fetchLanguages();
      setToast({
        show: true,
        message: editingId ? "Langage modifié avec succès !" : "Langage ajouté avec succès !",
        type: "success"
      });
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      setToast({ show: true, message: "Erreur : " + error.message, type: "error" });
    }
  };

  const handleEdit = (language) => {
    setFormData({
      nom: language.nom,
      description: language.description,
      icon: language.icon,
      color: language.color
    });
    setEditingId(language.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/langages/${id}`);
      fetchLanguages();
      setToast({ show: true, message: "Langage supprimé avec succès !", type: "success" });
    } catch (error) {
      setToast({ show: true, message: "Erreur lors de la suppression", type: "error" });
    }
  };

  const resetForm = () => {
    setFormData({
      nom: "",
      description: "",
      icon: "",
      color: "#000000"
    });
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  return (
    <AuthLayout>
      {toast.show && (
        <div className={`fixed top-24 right-4 z-50 px-4 py-3 rounded shadow-md text-white ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="pt-28 min-h-screen bg-gradient-to-r from-[#ececec] via-[#ffffff] to-[#eeeeee] px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Technologies</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-colors"
            >
              Add Technologie
            </motion.button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {languages.map((language) => (
                  <motion.div
                    key={language.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    style={{ borderTop: `4px solid ${language.color}` }}
                  >
                    <div className="p-6">
                      <div className="flex items-center mb-3">
                        {language.icon && (
                          <img 
                            src={language.icon} 
                            alt={`${language.nom} icon`} 
                            className="w-10 h-10 mr-3"
                          />
                        )}
                        <h2 className="text-xl font-semibold text-gray-800">
                          {language.nom}
                        </h2>
                      </div>
                      <p className="text-gray-600 mb-4">{language.description}</p>
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEdit(language)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(language.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#14111196] flex items-center justify-center p-4 z-50"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {editingId ? "Edit Language" : "Add New Language"}
                  </h2>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label htmlFor="nom" className="block text-gray-700 font-medium mb-2">Nom</label>
                      <input
                        type="text"
                        id="nom"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="description" className="block text-gray-700 font-medium mb-2">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="icon" className="block text-gray-700 font-medium mb-2">Icon URL</label>
                      <input
                        type="text"
                        id="icon"
                        name="icon"
                        value={formData.icon}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., html5.png"
                      />
                    </div>
                    <div className="mb-6">
                      <label htmlFor="color" className="block text-gray-700 font-medium mb-2">Color</label>
                      <div className="flex items-center">
                        <input
                          type="color"
                          id="color"
                          name="color"
                          value={formData.color}
                          onChange={handleChange}
                          className="w-10 h-10 border border-gray-300 rounded-md mr-3"
                        />
                        <input
                          type="text"
                          value={formData.color}
                          onChange={handleChange}
                          name="color"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        {editingId ? "Update" : "Create"}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}
