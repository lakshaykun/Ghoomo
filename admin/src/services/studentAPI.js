import dashboardAPI from './dashboardAPI';
import { listRides } from './rideAPI';

export async function listStudents({ page = 1, limit = 500 } = {}) {
  const [studentsResponse, ridesResponse] = await Promise.all([
    dashboardAPI.getUsers({ page, limit, role: 'rider' }),
    listRides({ page: 1, limit }),
  ]);

  const recentRideMap = new Map();

  (ridesResponse.data || []).forEach((ride) => {
    const studentKey = String(ride.studentId || '');

    if (studentKey && !recentRideMap.has(studentKey)) {
      recentRideMap.set(studentKey, ride);
    }
  });

  const students = (studentsResponse.data || []).map((student) => ({
    ...student,
    recentRide: recentRideMap.get(String(student.id)) || null,
  }));

  return {
    students,
    pagination: studentsResponse.pagination || { page, limit },
  };
}
