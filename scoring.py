def compute_score(round_number, bid, tricks, bonus=0):
    """Standard Skull King scoring.

    - Bid 0: +10 per round number if 0 tricks won, otherwise -10 per round number.
    - Bid > 0, hit exactly: +20 per bid trick, plus any bonus points.
    - Bid > 0, missed: -10 per trick of difference, bonus points are lost.
    """
    bonus = bonus or 0
    if bid == 0:
        return (10 * round_number + bonus) if tricks == 0 else -10 * round_number
    if tricks == bid:
        return 20 * bid + bonus
    return -10 * abs(bid - tricks)
