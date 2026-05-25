import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Award, Save, Edit2, Bell, Lock, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { API_BASE_URL } from '../lib/api';
import { Country, State, City } from 'country-state-city';

const PHONE_LENGTHS: Record<string, number> = {
  IN: 10,
  US: 10,
  CA: 10,
  GB: 10,
  AU: 9,
  NZ: 9,
  SG: 8,
  AE: 9,
};

const getPhoneLimit = (countryCode: string) => {
  if (!countryCode) return 15;
  return PHONE_LENGTHS[countryCode.toUpperCase()] || 15;
};

const getCountryData = (countryVal: string) => {
  if (!countryVal) return null;
  const upper = countryVal.toUpperCase();
  const country = Country.getCountryByCode(upper);
  if (country) {
    return {
      code: country.isoCode,
      name: country.name,
      flag: country.flag,
      dialCode: country.phonecode.startsWith('+') ? country.phonecode : `+${country.phonecode}`,
    };
  }
  const foundByName = Country.getAllCountries().find(
    c => c.name.toUpperCase() === upper
  );
  if (foundByName) {
    return {
      code: foundByName.isoCode,
      name: foundByName.name,
      flag: foundByName.flag,
      dialCode: foundByName.phonecode.startsWith('+') ? foundByName.phonecode : `+${foundByName.phonecode}`,
    };
  }
  return null;
};

const stripDialCode = (phone: string, countryCode: string) => {
  if (!phone) return "";
  const cData = getCountryData(countryCode);
  if (!cData) return phone;
  const dial = cData.dialCode;
  const cleanDial = dial.replace(/\D/g, "");
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.startsWith(cleanDial)) {
    return cleanPhone.substring(cleanDial.length);
  }
  return cleanPhone;
};

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'subscription'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    targetScore: '' as string | number,
    examDate: '',
    bio: '',
    avatar: '',
    country: '',
    state: '',
    city: '',
    plan: 'Free',
  });

  // Sync state when user is loaded/updated
  useEffect(() => {
    if (user) {
      let detectedCountry = user.country || '';
      let rawPhone = user.phone || '';
      
      if (detectedCountry) {
        const cData = getCountryData(detectedCountry);
        if (cData) {
          detectedCountry = cData.code;
        }
      } else if (rawPhone) {
        const cleanPhone = rawPhone.replace(/\D/g, '');
        const sortedCountries = [...Country.getAllCountries()].sort(
          (a, b) => b.phonecode.length - a.phonecode.length
        );
        for (const c of sortedCountries) {
          const cleanDial = c.phonecode.replace(/\D/g, '');
          if (cleanPhone.startsWith(cleanDial)) {
            detectedCountry = c.isoCode;
            break;
          }
        }
      }

      let detectedState = user.state || '';
      if (detectedCountry && detectedState) {
        const states = State.getStatesOfCountry(detectedCountry);
        const match = states.find(
          (s) => s.isoCode.toUpperCase() === detectedState.toUpperCase() || s.name.toUpperCase() === detectedState.toUpperCase()
        );
        if (match) {
          detectedState = match.name;
        }
      }

      let detectedCity = user.city || '';
      if (detectedCountry && detectedState && detectedCity) {
        const states = State.getStatesOfCountry(detectedCountry);
        const matchState = states.find((s) => s.name === detectedState);
        if (matchState) {
          const cities = City.getCitiesOfState(detectedCountry, matchState.isoCode);
          const matchCity = cities.find(
            (c) => c.name.toUpperCase() === detectedCity.toUpperCase()
          );
          if (matchCity) {
            detectedCity = matchCity.name;
          }
        }
      }

      const cleanPhone = stripDialCode(rawPhone, detectedCountry);

      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: cleanPhone,
        location: user.location || '',
        targetScore: user.targetScore || '',
        examDate: user.examDate ? user.examDate.substring(0, 10) : '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        country: detectedCountry,
        state: detectedState,
        city: detectedCity,
        plan: user.plan || 'Free',
      });
    }
  }, [user]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanVal = rawVal.replace(/\D/g, '');
    const limit = getPhoneLimit(profileData.country);
    if (cleanVal.length <= limit) {
      setProfileData(prev => ({ ...prev, phone: cleanVal }));
    }
  };

  const handleCountryChange = (countryCode: string) => {
    const limit = getPhoneLimit(countryCode);
    const truncatedPhone = profileData.phone.replace(/\D/g, '').substring(0, limit);
    setProfileData(prev => ({
      ...prev,
      country: countryCode,
      state: '',
      city: '',
      phone: truncatedPhone
    }));
  };

  const handleStateChange = (stateName: string) => {
    setProfileData(prev => ({
      ...prev,
      state: stateName,
      city: ''
    }));
  };

  const handleAvatarChange = () => {
    if (!isEditing) setIsEditing(true);
    const newSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${newSeed}`;
    setProfileData(prev => ({ ...prev, avatar: newAvatar }));
    toast.success('Generated a new random avatar. Save changes to keep it!');
  };

  const handleSave = async () => {
    if (profileData.phone) {
      const cData = getCountryData(profileData.country);
      const limit = getPhoneLimit(profileData.country);
      if (cData) {
        if (limit !== 15 && profileData.phone.length !== limit) {
          toast.error(`Phone number must be exactly ${limit} digits for ${cData.name}.`);
          return;
        } else if (limit === 15 && (profileData.phone.length < 7 || profileData.phone.length > 15)) {
          toast.error(`Phone number must be between 7 and 15 digits.`);
          return;
        }
      }
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      const cData = getCountryData(profileData.country);
      const fullPhone = profileData.phone && cData
        ? `${cData.dialCode}${profileData.phone}`
        : profileData.phone;

      const displayLocation = profileData.country 
        ? [profileData.city, profileData.state, cData ? cData.name : profileData.country].filter(Boolean).join(', ')
        : profileData.location;

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileData.name,
          phone: fullPhone,
          location: displayLocation,
          targetScore: profileData.targetScore,
          examDate: profileData.examDate,
          bio: profileData.bio,
          avatar: profileData.avatar,
          country: profileData.country,
          state: profileData.state,
          city: profileData.city,
          plan: profileData.plan,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      const updatedUser = {
        ...user,
        ...data.user
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <img
                src={profileData.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'}
                alt={profileData.name}
                className="h-24 w-24 rounded-full border-4 border-white shadow-xl object-cover bg-white"
              />
              <button 
                onClick={handleAvatarChange}
                className="absolute bottom-0 right-0 p-2 bg-white text-blue-600 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold mb-2">{profileData.name}</h1>
              <p className="text-white/90 mb-2">{profileData.email}</p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  {profileData.plan || 'Free'} Member
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  Target Score: {profileData.targetScore || 'N/A'}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                  Exam: {profileData.examDate || 'Not Scheduled'}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <nav className="space-y-2">
                {[
                  { id: 'profile', label: 'Profile Info', icon: User },
                  { id: 'settings', label: 'Settings', icon: Bell },
                  { id: 'subscription', label: 'Subscription', icon: CreditCard },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-bold mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Current Score</span>
                    <span className="font-bold text-blue-600">82/90</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tests Taken</span>
                    <span className="font-bold">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Improvement</span>
                    <span className="font-bold text-green-600">+12</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold mb-6">Personal Information</h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          disabled={!isEditing || isSaving}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 disabled:bg-gray-50 dark:disabled:bg-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={profileData.email}
                          disabled={true}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-75"
                        />
                      </div>
                    </div>

                    {/* Country Dropdown */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Country</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                          value={profileData.country}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          disabled={!isEditing || isSaving}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 disabled:bg-gray-50 dark:disabled:bg-gray-900 bg-white dark:bg-gray-800"
                        >
                          <option value="" className="dark:bg-gray-800">Select Country</option>
                          {Country.getAllCountries().map((c) => (
                            <option key={c.isoCode} value={c.isoCode} className="dark:bg-gray-800">
                              {c.flag} {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Phone Number Input */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number</label>
                      <div className="flex rounded-lg overflow-hidden">
                        {/* Flag and Code Prefix */}
                        <div className="flex items-center gap-1.5 px-3 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-50 dark:bg-gray-800 text-gray-500 min-w-[75px] justify-center select-none border-solid">
                          {(() => {
                            const cData = getCountryData(profileData.country);
                            return cData ? (
                              <>
                                <span className="text-lg">{cData.flag}</span>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{cData.dialCode}</span>
                              </>
                            ) : (
                              <Phone className="h-4 w-4 text-gray-400" />
                            );
                          })()}
                        </div>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={handlePhoneChange}
                          disabled={!isEditing || isSaving}
                          placeholder={(() => {
                            const limit = getPhoneLimit(profileData.country);
                            return limit !== 15 ? `Enter ${limit}-digit number` : "Select country first";
                          })()}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-r-lg dark:bg-gray-700 disabled:bg-gray-50 dark:disabled:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* State Dropdown */}
                    <div>
                      <label className="block text-sm font-medium mb-2">State</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                          value={profileData.state}
                          onChange={(e) => handleStateChange(e.target.value)}
                          disabled={!isEditing || isSaving || !profileData.country}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 disabled:bg-gray-50 dark:disabled:bg-gray-900 bg-white dark:bg-gray-800"
                        >
                          <option value="" className="dark:bg-gray-800">Select State</option>
                          {profileData.country &&
                            State.getStatesOfCountry(profileData.country).map((s) => (
                              <option key={s.isoCode} value={s.name} className="dark:bg-gray-800">
                                {s.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* City Dropdown */}
                    <div>
                      <label className="block text-sm font-medium mb-2">City</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                          value={profileData.city}
                          onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                          disabled={!isEditing || isSaving || !profileData.state}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 disabled:bg-gray-50 dark:disabled:bg-gray-900 bg-white dark:bg-gray-800"
                        >
                          <option value="" className="dark:bg-gray-800">Select City</option>
                          {(() => {
                            if (profileData.country && profileData.state) {
                              const states = State.getStatesOfCountry(profileData.country);
                              const selectedStateObj = states.find(
                                (s) => s.name === profileData.state || s.isoCode === profileData.state
                              );
                              if (selectedStateObj) {
                                return City.getCitiesOfState(profileData.country, selectedStateObj.isoCode).map((city) => (
                                  <option key={city.name} value={city.name} className="dark:bg-gray-800">
                                    {city.name}
                                  </option>
                                ));
                              }
                            }
                            return null;
                          })()}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Target Score</label>
                      <div className="relative">
                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          value={profileData.targetScore}
                          onChange={(e) => setProfileData({ ...profileData, targetScore: parseInt(e.target.value) || 0 })}
                          disabled={!isEditing || isSaving}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 disabled:bg-gray-50 dark:disabled:bg-gray-900"
                        />
                      </div>
                    </div>

                     <div>
                       <label className="block text-sm font-medium mb-2">Exam Date</label>
                       <div className="relative">
                         <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                         <input
                           type="date"
                           value={profileData.examDate}
                           onChange={(e) => setProfileData({ ...profileData, examDate: e.target.value })}
                           disabled={!isEditing || isSaving}
                           className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 disabled:bg-gray-50 dark:disabled:bg-gray-900"
                         />
                       </div>
                     </div>

                     <div>
                       <label className="block text-sm font-medium mb-2">Subscription Plan</label>
                       <div className="relative">
                         <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                         <select
                           value={profileData.plan}
                           onChange={(e) => setProfileData({ ...profileData, plan: e.target.value })}
                           disabled={!isEditing || isSaving}
                           className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 disabled:bg-gray-50 dark:disabled:bg-gray-900 bg-white dark:bg-gray-800"
                         >
                           <option value="Free" className="dark:bg-gray-800">Free</option>
                           <option value="Basic" className="dark:bg-gray-800">Basic</option>
                           <option value="Premium" className="dark:bg-gray-800">Premium</option>
                           <option value="Pro" className="dark:bg-gray-800">Pro</option>
                         </select>
                       </div>
                     </div>
                   </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      disabled={!isEditing || isSaving}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 disabled:bg-gray-50 dark:disabled:bg-gray-900"
                    />
                  </div>

                  {isEditing && (
                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <Save className="h-5 w-5" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Achievements */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold mb-6">Achievements</h2>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { icon: '🏆', title: 'First Mock Test', desc: 'Completed first practice test' },
                      { icon: '🔥', title: '7 Day Streak', desc: 'Practiced for 7 days straight' },
                      { icon: '⭐', title: 'High Scorer', desc: 'Scored above 80' },
                      { icon: '📚', title: 'Dedicated Learner', desc: 'Completed 100 questions' },
                      { icon: '🎯', title: 'Perfect Score', desc: 'Got 90/90 in a module' },
                      { icon: '💪', title: 'Improver', desc: 'Improved by 15 points' },
                    ].map((achievement, index) => (
                      <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-4xl mb-2">{achievement.icon}</div>
                        <h3 className="font-bold mb-1">{achievement.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-6">Notification Settings</h2>

                <div className="space-y-4">
                  {[
                    { label: 'Email Notifications', desc: 'Receive updates via email' },
                    { label: 'Practice Reminders', desc: 'Daily practice reminders' },
                    { label: 'Test Results', desc: 'Get notified when results are ready' },
                    { label: 'New Content', desc: 'Updates about new study materials' },
                    { label: 'Live Class Reminders', desc: 'Reminders for upcoming classes' },
                  ].map((setting, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <div className="font-semibold">{setting.label}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{setting.desc}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold mb-4">Security</h3>
                  <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </button>
                </div>
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">{profileData.plan || 'Free'} Plan</h2>
                      <p className="text-white/90">Active until June 15, 2026</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold mb-1">₹1,999</div>
                      <div className="text-white/90">/month</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-4">Payment History</h3>
                  <div className="space-y-3">
                    {[
                      { date: '2026-05-01', amount: 1999, status: 'Paid', method: 'UPI' },
                      { date: '2026-04-01', amount: 1999, status: 'Paid', method: 'Card' },
                      { date: '2026-03-01', amount: 1999, status: 'Paid', method: 'UPI' },
                    ].map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <div className="font-semibold">{payment.date}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            via {payment.method}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">₹{payment.amount}</div>
                          <div className="text-sm text-green-600">{payment.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
