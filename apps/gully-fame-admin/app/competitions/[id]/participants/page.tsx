'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ArrowLeft, Users, RefreshCw } from 'lucide-react';
import { getCompetitionById, getCompetitionParticipants, type Competition, type CompetitionParticipant } from '@/lib/competitionApi';

export default function CompetitionParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [participants, setParticipants] = useState<CompetitionParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [compResult, participantsResult] = await Promise.all([
        getCompetitionById(params.id as string),
        getCompetitionParticipants(params.id as string),
      ]);
      
      if (compResult.success && compResult.data) {
        setCompetition(compResult.data);
      }
      
      if (participantsResult.success && participantsResult.data) {
        setParticipants(participantsResult.data);
      } else {
        setError(participantsResult.message || 'Failed to fetch participants');
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading participants...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !competition) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">{error}</p>
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <button
            onClick={fetchData}
            className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {competition?.title || 'Competition'} - Participants
          </h1>
          <p className="mt-2 text-gray-600">
            {participants.length} participant{participants.length !== 1 ? 's' : ''} registered
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {participants.length === 0 ? (
          <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No participants yet</p>
            <p className="text-sm text-gray-500 mt-2">Participants will appear here once they join the competition.</p>
          </div>
        ) : (
          <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((participant, index) => (
                  <tr key={participant.id || participant._id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {participant.rank || index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {participant.userImage || participant.profileImage ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={participant.userImage || participant.profileImage}
                            alt={participant.userName || 'Participant'}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {participant.userName || participant.firstName && participant.lastName
                              ? `${participant.firstName} ${participant.lastName}`
                              : 'Unknown User'}
                          </div>
                          {participant.userId && (
                            <div className="text-sm text-gray-500">ID: {participant.userId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.entryCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.totalVotes || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.joinedAt
                        ? new Date(participant.joinedAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

