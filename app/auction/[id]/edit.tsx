import { useLocalSearchParams } from 'expo-router';
import EditAuctionScreen from '../../../src/screens/EditAuctionScreen';

export default function EditAuctionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditAuctionScreen auctionId={id ?? ''} />;
}
