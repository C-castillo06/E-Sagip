import {
  STORAGE_KEYS,
  readStorage,
  writeStorage
} from './storage';

// ========================================
// USERS
// ========================================

export function getUsers() {
  return readStorage(
    STORAGE_KEYS.users,
    []
  );
}

export function findUserByEmail(email) {
  const normalized = email
    .trim()
    .toLowerCase();

  return getUsers().find(
    u => u.email === normalized
  );
}

// ========================================
// REGISTER
// ========================================
//
// Returns { user } on success,
// or { error } when registration fails.
// ========================================

export function registerUser({
  firstName,
  lastName,
  email,
  password,
  role,
  station
}) {
  const normalized = email
    .trim()
    .toLowerCase();

  const users = getUsers();

  if (
    users.some(
      u => u.email === normalized
    )
  ) {
    return {
      error:
        'An account with this email already exists.'
    };
  }

  const user = {
    id: crypto.randomUUID(),

    firstName: firstName.trim(),
    lastName: lastName.trim(),

    email: normalized,
    password,
    role,

    /*
     * Station configured during registration.
     *
     * Example:
     * {
     *   name: 'Fire Station',
     *   address: '...',
     *   lat: 14.7118,
     *   lng: 121.0453,
     *   radius: 10000
     * }
     */
    station: station
      ? {
          name:
            station.name ||
            `${role} Station`,
          address:
            station.address || '',
          lat: Number(station.lat),
          lng: Number(station.lng),
          radius: Number(station.radius)
        }
      : null,

    createdAt: Date.now()
  };

  writeStorage(
    STORAGE_KEYS.users,
    [
      ...users,
      user
    ]
  );

  return { user };
}

// ========================================
// LOGIN
// ========================================

export function loginUser({
  email,
  password,
  role
}) {
  const normalized = email
    .trim()
    .toLowerCase();

  const users = getUsers();

  const user = users.find(
    u =>
      u.email === normalized &&
      u.role === role &&
      u.password === password
  );

  if (!user) {
    return {
      error:
        'Invalid email, password, or department. If you do not have an account yet, please register.'
    };
  }

  /*
   * Put station information into the session.
   *
   * The dashboard can therefore immediately use
   * the station belonging to this dispatcher.
   */
  const session = {
    email: user.email,
    role: user.role,
    name:
      `${user.firstName} ${user.lastName}`.trim(),

    station: user.station || null
  };

  writeStorage(
    STORAGE_KEYS.session,
    session
  );

  return { session };
}

// ========================================
// SESSION
// ========================================

export function getSession() {
  return readStorage(
    STORAGE_KEYS.session,
    null
  );
}

export function clearSession() {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(
    STORAGE_KEYS.session
  );
}