export interface KitchenTip {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryName: string;
  mdPath: string;
}

export interface KitchenTipsData {
  tips: KitchenTip[];
  categories: string[];
}
