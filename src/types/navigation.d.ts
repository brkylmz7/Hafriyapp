import { TabParamList } from '../navigation/BottomTabs';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends TabParamList {}
  }
}
