import { shortId } from '@/lib/format';
import type { UserVehicle } from './api';

/** The vehicle's nickname when the collection shows one, else its short id. */
export function vehicleLabel(vehicle: UserVehicle): string {
  const nickname = vehicle.nickname;
  return typeof nickname === 'string' && nickname.trim() !== '' ? nickname : shortId(vehicle.id);
}
