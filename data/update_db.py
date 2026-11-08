import sqlite3

con = sqlite3.connect(r'C:\Users\SASWATA\.gemini\antigravity\scratch\diploma-billing\data\billing.db')
cur = con.cursor()

cur.execute("UPDATE rate_charts SET level_name = 'All India Churamoni Examination' WHERE level_name = 'All India Churamoni'")
print('Updated rate_charts:', cur.rowcount)

cur.execute("UPDATE bill_items SET level_name = 'All India Churamoni Examination' WHERE level_name = 'All India Churamoni'")
print('Updated bill_items:', cur.rowcount)

con.commit()

cur.execute("SELECT zone, discipline, level_name, exam_fee FROM rate_charts WHERE level_name LIKE '%Churamoni%'")
for row in cur.fetchall():
    print(row)

con.close()
