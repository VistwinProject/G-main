export const LEVELS = [
  { title:'第一階・讀懂警報', route:3, safe:'B', blocked:'A', seconds:30,
    brief:'警報剛響起。從北側房間出發，先辨認封鎖方向。',
    question:'警報響起，你先做哪一步？', good:'先確認警報與路線資訊', goodNote:'讀取現場狀態，再決定方向。',
    bad:'直接往熟悉的出口走', badNote:'先選平常最常走的路。', feedback:'先確認資訊，再選擇可通行方向。' },
  { title:'第二階・別照上一關走', route:2, safe:'A', blocked:'B', seconds:25,
    brief:'換到中央房間，這次封鎖方向不同。上一關的答案不能直接套用。',
    question:'出口狀態改變，怎麼判斷？', good:'重新確認這一關的出口狀態', goodNote:'跟著最新標記重新規劃。',
    bad:'沿用上一關的 B 出口', badNote:'上一關走得通，這次應該也一樣。', feedback:'出口狀態會改變，不能沿用上一關的答案。' },
];
