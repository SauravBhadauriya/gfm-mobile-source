'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { getUserRole } from '@/lib/auth';
import { mockCompetitions } from '@/lib/mockData';

export default function EditCompetitionPage() {
  const params = useParams();
  const router = useRouter();
  const userRole = getUserRole();
  const competition = mockCompetitions.find(c => c.id === params.id);

  const [formData, setFormData] = useState({
    title: competition?.title || '',
    description: competition?.description || '',
    rules: competition?.rules || '',
    startDate: competition?.startDate || '',
    endDate: competition?.endDate || '',
    prizeAmount: competition?.prizeAmount || 0,
    category: competition?.category || '',
    status: competition?.status || 'draft',
    winnerSlots: competition?.winnerSlots || 3,
    bannerImage: competition?.bannerImage || '',
    sponsorLogo: competition?.sponsorLogo || '',
  });

  if (!competition) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Competition not found</p>
          <button
            onClick={() => router.push('/competitions')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Back to Competitions
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Competition updated successfully!');
    router.push(`/competitions/${competition.id}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Competition</h1>
          <p className="mt-2 text-gray-600">Update competition details</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Competition title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Competition description"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Competition Rules *</label>
              <textarea
                rows={8}
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Enter competition rules (one per line)..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">Enter each rule on a new line. Use numbers (1., 2., etc.) for formatting.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prize Money (₹) *</label>
                <input
                  type="number"
                  value={formData.prizeAmount}
                  onChange={(e) => setFormData({ ...formData, prizeAmount: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="100000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  required
                >
                  <option value="">Select category...</option>
                  <option value="Dance">Dance</option>
                  <option value="Music">Music</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Cooking">Cooking</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Winner Slots</label>
                <input
                  type="number"
                  value={formData.winnerSlots}
                  onChange={(e) => setFormData({ ...formData, winnerSlots: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="3"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
              {formData.bannerImage && (
                <div className="mb-3">
                  <img src={formData.bannerImage} alt="Banner" className="h-32 w-full object-cover rounded-lg" />
                </div>
              )}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
              </div>
            </div>

            {userRole === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sponsor Logo (Optional)</label>
                {formData.sponsorLogo && (
                  <div className="mb-3">
                    <img src={formData.sponsorLogo} alt="Sponsor Logo" className="h-20 object-contain" />
                  </div>
                )}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Upload sponsor logo</p>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center space-x-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700"
              >
                <Save className="h-5 w-5" />
                <span>Update Competition</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

