select q1.*,
q2.game_id AS 'hand_id',
q2.noOfUser,
q2.EVCHOP_PROFIT_LOSS,
q2.EVCHOP_FEE,
q1.TRANSACTION_AMOUNT + q2.EVCHOP_PROFIT_LOSS AS 'remaining_pot_after_rake'
from
(select * from ev_operator.evchop_transactions_log where TRANSACTION_ID IN (
select TRANSACTION_ID from ev_operator.evchop_transaction_history where TRANSACTION_ID IN (select ev.TRANSACTION_ID 
from ev_operator.evchop_transactions_log ev where 
ev.TRANSACTION_ID NOT IN (select ev.TRANSACTION_ID from ev_operator.evchop_transactions_log ev 
where ev.TRANSACTION_TYPE_ID IN (175, 213) and ev.CREATED_DATE <= '2025-05-26 06:00:00' and ev.CREATED_DATE >= '2025-05-22 06:00:00')
and ev.TRANSACTION_TYPE_ID = (176) and ev.CREATED_DATE <= '2025-05-26 06:00:00' and ev.CREATED_DATE >= '2025-05-22 06:00:00' and ev.IS_PROCESSED != 0)
and TRANSACTION_TYPE_ID IN (208) and CREATED_DATE <= '2025-05-26 06:00:00' and CREATED_DATE >= '2025-05-22 06:00:00' and TRANSACTION_AMOUNT=0)
AND CREATED_DATE <= '2025-05-26 06:00:00' and CREATED_DATE >= '2025-05-22 06:00:00') AS q1
INNER JOIN
(select userCount.game_id,
userCount.noOfUser,
evchopProfitLoss.EVCHOP_PROFIT_LOSS,
evchopProfitLoss.EVCHOP_FEE
from
(select ghu.game_id, count(*) AS 'noOfUser' from zoom_poker.game_history_user ghu where game_id IN (select HAND_ID from ev_operator.evchop_transaction_history where TRANSACTION_ID IN (select ev.TRANSACTION_ID 
from ev_operator.evchop_transactions_log ev where 
ev.TRANSACTION_ID NOT IN (select ev.TRANSACTION_ID from ev_operator.evchop_transactions_log ev 
where ev.TRANSACTION_TYPE_ID IN (175, 213) and ev.CREATED_DATE >= '2025-05-22 06:00:00' and ev.CREATED_DATE <= '2025-05-26 06:00:00')
and ev.TRANSACTION_TYPE_ID = (176) and ev.CREATED_DATE >= '2025-05-22 06:00:00' and ev.CREATED_DATE <= '2025-05-26 06:00:00'  and ev.IS_PROCESSED != 0)
and TRANSACTION_TYPE_ID IN (208) and CREATED_DATE >= '2025-05-22 06:00:00' and CREATED_DATE <= '2025-05-26 06:00:00'  and TRANSACTION_AMOUNT=0)
and ghu.evchop_fee >= 0 and ghu.started >= "2025-05-22 06:00:00" group by ghu.game_id) AS userCount
INNER JOIN
(SELECT game_id, EVCHOP_PROFIT_LOSS, EVCHOP_FEE FROM zoom_poker.game_history where game_id in (select HAND_ID from ev_operator.evchop_transaction_history where TRANSACTION_ID IN (select ev.TRANSACTION_ID 
from ev_operator.evchop_transactions_log ev where 
ev.TRANSACTION_ID NOT IN (select ev.TRANSACTION_ID from ev_operator.evchop_transactions_log ev 
where ev.TRANSACTION_TYPE_ID IN (175, 213) and ev.CREATED_DATE >= '2025-05-22 06:00:00' and ev.CREATED_DATE <= '2025-05-26 06:00:00')
and ev.TRANSACTION_TYPE_ID = (176) and ev.CREATED_DATE >= '2025-05-22 06:00:00' and ev.CREATED_DATE <= '2025-05-26 06:00:00'  and ev.IS_PROCESSED != 0)
and TRANSACTION_TYPE_ID IN (208) and CREATED_DATE >= '2025-05-22 06:00:00' and CREATED_DATE <= '2025-05-26 06:00:00'  and TRANSACTION_AMOUNT=0)
and started > "2025-05-22 06:00:00") AS evchopProfitLoss ON userCount.game_id = evchopProfitLoss.game_id) AS q2 ON q1.hand_id = q2.game_id;