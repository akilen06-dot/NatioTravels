import { Route, Routes } from 'react-router-dom'
import Landing from './routes/marketing/Landing'
import About from './routes/marketing/About'
import SafetyPolicy from './routes/marketing/SafetyPolicy'
import Terms from './routes/marketing/Terms'
import Start from './routes/Start'
import AuthChoice from './routes/auth/AuthChoice'
import SignUp from './routes/auth/SignUp'
import SignIn from './routes/auth/SignIn'
import ForgotPassword from './routes/auth/ForgotPassword'
import ResetPassword from './routes/auth/ResetPassword'
import OnboardingGuard, { PlanGuard } from './components/OnboardingGuard'
import LocationPermission from './routes/onboarding/LocationPermission'
import IdentityVerification from './routes/onboarding/IdentityVerification'
import AddProfilePhoto from './routes/onboarding/AddProfilePhoto'
import PlanSelect from './routes/onboarding/PlanSelect'
import AppShell from './components/AppShell'
import DiscoverScreen from './routes/discover/DiscoverScreen'
import GroupsScreen from './routes/groups/GroupsScreen'
import GroupDetail from './routes/groups/GroupDetail'
import CreateGroup from './routes/groups/CreateGroup'
import MessagesScreen from './routes/messages/MessagesScreen'
import ChatThread from './routes/messages/ChatThread'
import NotificationsScreen from './routes/notifications/NotificationsScreen'
import ProfileScreen from './routes/profile/ProfileScreen'
import SafetyCenter from './routes/profile/SafetyCenter'
import NewPost from './routes/profile/NewPost'
import EditProfile from './routes/profile/EditProfile'
import PostDetail from './routes/profile/PostDetail'
import PersonProfile from './routes/profile/PersonProfile'
import SearchScreen from './routes/search/SearchScreen'
import SettingsHub from './routes/profile/settings/SettingsHub'
import AccountSettings from './routes/profile/settings/AccountSettings'
import ArchiveScreen from './routes/profile/settings/ArchiveScreen'
import NotificationSettings from './routes/profile/settings/NotificationSettings'
import PrivacySettings from './routes/profile/settings/PrivacySettings'
import BlockedReported from './routes/profile/settings/BlockedReported'
import DevicePermissions from './routes/profile/settings/DevicePermissions'
import LanguageSettings from './routes/profile/settings/LanguageSettings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/safety" element={<SafetyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/start" element={<Start />} />
      <Route path="/auth" element={<AuthChoice />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<OnboardingGuard />}>
        <Route path="/onboarding/location" element={<LocationPermission />} />
        <Route path="/onboarding/verify" element={<IdentityVerification />} />
        <Route path="/onboarding/photo" element={<AddProfilePhoto />} />
      </Route>
      <Route element={<PlanGuard />}>
        <Route path="/onboarding/plan" element={<PlanSelect />} />
      </Route>

      <Route element={<AppShell />}>
        <Route path="/discover" element={<DiscoverScreen />} />
        <Route path="/search" element={<SearchScreen />} />
        <Route path="/groups" element={<GroupsScreen />} />
        <Route path="/groups/new" element={<CreateGroup />} />
        <Route path="/groups/:id" element={<GroupDetail />} />
        <Route path="/messages" element={<MessagesScreen />} />
        <Route path="/messages/:id" element={<ChatThread />} />
        <Route path="/notifications" element={<NotificationsScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/profile/new" element={<NewPost />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/safety" element={<SafetyCenter />} />
        <Route path="/profile/settings" element={<SettingsHub />} />
        <Route path="/profile/settings/account" element={<AccountSettings />} />
        <Route path="/profile/settings/archive" element={<ArchiveScreen />} />
        <Route path="/profile/settings/notifications" element={<NotificationSettings />} />
        <Route path="/profile/settings/privacy" element={<PrivacySettings />} />
        <Route path="/profile/settings/blocked" element={<BlockedReported />} />
        <Route path="/profile/settings/devices" element={<DevicePermissions />} />
        <Route path="/profile/settings/language" element={<LanguageSettings />} />
        <Route path="/posts/:postId" element={<PostDetail />} />
        <Route path="/people/:id" element={<PersonProfile />} />
      </Route>
    </Routes>
  )
}
