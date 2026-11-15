import unittest

from models.insights import MIN_ATTEMPTS_FOR_INSIGHTS, MIN_TOPIC_ATTEMPTS, compute_insights


class InsightsTests(unittest.TestCase):
    def test_match_analytics_are_returned_without_submission_rows(self):
        response = compute_insights(
            [],
            [
                {"matchIndex": 1, "result": "WIN", "ratingAfter": 1510},
                {"matchIndex": 2, "result": "DRAW", "ratingAfter": 1512},
            ],
        )

        self.assertEqual(response["attempts"], 0)
        self.assertFalse(response["ready"])
        self.assertEqual(response["record"]["wins"], 1)
        self.assertEqual(response["record"]["draws"], 1)
        self.assertEqual(len(response["ratingHistory"]), 2)

    def test_unknown_topics_count_as_attempts_but_not_topic_statistics(self):
        submissions = [
            {
                "difficulty": "EASY",
                "topic": None,
                "accepted": False,
                "solveTimeSec": None,
                "matchIndex": index,
            }
            for index in range(1, MIN_ATTEMPTS_FOR_INSIGHTS + 1)
        ]

        response = compute_insights(submissions)

        self.assertEqual(response["attempts"], MIN_ATTEMPTS_FOR_INSIGHTS)
        self.assertTrue(response["ready"])
        self.assertEqual(response["overallAccuracy"], 0)
        self.assertEqual(response["difficulty"]["EASY"]["attempts"], MIN_ATTEMPTS_FOR_INSIGHTS)
        self.assertEqual(response["topics"], {})
        self.assertIsNone(response["strongestTopic"])
        self.assertIsNone(response["weakestTopic"])

    def test_readiness_and_topic_comparisons_keep_their_minimum_thresholds(self):
        four_attempts = [
            {
                "difficulty": "EASY",
                "topic": "Arrays",
                "accepted": True,
                "solveTimeSec": 30,
                "matchIndex": index,
            }
            for index in range(1, MIN_ATTEMPTS_FOR_INSIGHTS)
        ]
        response = compute_insights(four_attempts)
        self.assertFalse(response["ready"])

        five_attempts = [
            {
                "difficulty": "EASY",
                "topic": "Arrays" if index <= 3 else "Strings",
                "accepted": index <= 3,
                "solveTimeSec": 30 if index <= 3 else None,
                "matchIndex": index,
            }
            for index in range(1, MIN_ATTEMPTS_FOR_INSIGHTS + 1)
        ]
        response = compute_insights(five_attempts)
        self.assertTrue(response["ready"])
        self.assertEqual(response["topics"]["Arrays"]["attempts"], MIN_TOPIC_ATTEMPTS)
        self.assertEqual(response["topics"]["Strings"]["attempts"], 2)
        self.assertIsNone(response["strongestTopic"])
        self.assertIsNone(response["weakestTopic"])

        six_attempts = five_attempts + [
            {
                "difficulty": "EASY",
                "topic": "Strings",
                "accepted": False,
                "solveTimeSec": None,
                "matchIndex": 6,
            }
        ]
        response = compute_insights(six_attempts)
        self.assertEqual(response["topics"]["Strings"]["attempts"], MIN_TOPIC_ATTEMPTS)
        self.assertEqual(response["strongestTopic"], "Arrays")
        self.assertEqual(response["weakestTopic"], "Strings")


if __name__ == "__main__":
    unittest.main()
