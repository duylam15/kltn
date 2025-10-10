import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Material {
  id: number;
  title: string;
  description: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  originalMaterialId: string;
  category: string;
  isPublic: boolean;
  downloadCount: number;
  uploadedBy: number;
  uploadedAt: string;
  updatedAt: string;
}

interface CourseMaterial {
  id: number;
  courseSectionId: number;
  materialId: number;
  assignedBy: number;
  assignedAt: string;
  isOpen: boolean;
  material: Material;
}

interface ApiResponse {
  success: boolean;
  data: CourseMaterial[];
}

export default function MaterialStudent() {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [searchTerm, materials]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await axios.get<ApiResponse>(
        'http://localhost:4000/api/v1/materials/class/100'
      );

      if (response.data.success) {
        setMaterials(response.data.data);
        setFilteredMaterials(response.data.data);
      }
    } catch (err) {
      setError('Không thể tải dữ liệu tài liệu');
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    if (!searchTerm.trim()) {
      setFilteredMaterials(materials);
      return;
    }

    const filtered = materials.filter((item) => {
      const material = item.material;
      return (
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    setFilteredMaterials(filtered);
  };

  const handleDownload = (material: Material) => {
    console.log('Downloading:', material.fileName);
    window.open(`http://localhost:4000/${material.filePath}`, '_blank');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long'
    });
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📈';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('video')) return '🎥';
    return '📎';
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchMaterials}
            className="text-blue-600 hover:underline"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Search Bar */}
      <div className="w-full bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-2xl px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Materials List */}
      <div className="w-full px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {filteredMaterials.length === 0 ? (
            <div className="w-full bg-white rounded-lg border p-8 text-center">
              <p className="text-gray-600">Không có tài liệu nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMaterials.map((item) => (
                <div
                  key={item.id}
                  className="w-full bg-white rounded-xl border border-blue-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleDownload(item.material)}
                >
                  <div className="flex items-center justify-between p-5">
                    {/* Left side - Icon and Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
                        {getFileIcon(item.material.fileType)}
                      </div>

                      {/* Text Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-normal text-gray-900 truncate">
                          <span className="text-gray-700">Tài liệu đã đăng một tài liệu mới: </span>
                          <span className="font-medium">{item.material.fileName}</span>
                        </h3>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {formatDate(item.assignedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Right side - Menu button */}
                    <button
                      className="flex-shrink-0 p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle menu click
                      }}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}