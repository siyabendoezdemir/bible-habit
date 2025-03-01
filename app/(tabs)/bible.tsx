import { Redirect } from 'expo-router';

export default function BibleTab() {
  // Use redirect instead of directly rendering the component
  // This avoids the infinite update loop
  return <Redirect href="/bible" />;
} 