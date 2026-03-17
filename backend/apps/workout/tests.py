import pytest
from apps.workout.models import (
    Criterion,
    Exercise,
    ExerciseSet,
    Ladder,
    LadderNode,
    PlanSlot,
    SessionExercise,
    UserNodeProgress,
    WeeklyPlan,
    WorkoutSession,
    WorkoutUser,
)


class TestWorkoutUserSignal:
    def test_workout_user_created_on_user_creation(self, user):
        assert WorkoutUser.objects.filter(user=user).exists()


class TestExerciseModel:
    def test_create_exercise(self, workout_user):
        exercise = Exercise.objects.create(
            owner=workout_user, name='Pull-up', description='Standard pull-up'
        )
        assert str(exercise) == 'Pull-up'

    def test_exercise_ordering(self, workout_user):
        Exercise.objects.create(owner=workout_user, name='Squat')
        Exercise.objects.create(owner=workout_user, name='Bench Press')
        exercises = list(Exercise.objects.filter(owner=workout_user))
        assert exercises[0].name == 'Bench Press'
        assert exercises[1].name == 'Squat'


class TestLadderModel:
    def test_ladder_name_from_highest_node(self, workout_user):
        ladder = Ladder.objects.create(owner=workout_user)
        ex1 = Exercise.objects.create(owner=workout_user, name='Assisted Pull-up')
        ex2 = Exercise.objects.create(owner=workout_user, name='Weighted Pull-up')
        LadderNode.objects.create(ladder=ladder, exercise=ex1, level=1)
        LadderNode.objects.create(ladder=ladder, exercise=ex2, level=3)
        assert ladder.name == 'Weighted Pull-up'

    def test_empty_ladder_name(self, workout_user):
        ladder = Ladder.objects.create(owner=workout_user)
        assert ladder.name == 'Empty Ladder'


class TestCriterionModel:
    def test_create_criterion(self, workout_user):
        ladder = Ladder.objects.create(owner=workout_user)
        exercise = Exercise.objects.create(owner=workout_user, name='Pull-up')
        node = LadderNode.objects.create(ladder=ladder, exercise=exercise, level=1)
        criterion = Criterion.objects.create(
            ladder_node=node,
            type='min_reps_sets',
            params={'sets': 3, 'reps': 10},
        )
        assert criterion.params == {'sets': 3, 'reps': 10}


class TestPlanSlotValidation:
    def test_plan_slot_requires_ladder_or_exercise(self, workout_user):
        plan = WeeklyPlan.objects.create(owner=workout_user, name='Test Plan')
        slot = PlanSlot(weekly_plan=plan, day_of_week=0, order=1)
        with pytest.raises(Exception):
            slot.full_clean()


class TestExerciseSetFlexibleData:
    def test_reps_weight_type(self, workout_user):
        session = WorkoutSession.objects.create(
            user=workout_user, date='2026-03-16', status='in_progress'
        )
        exercise = Exercise.objects.create(owner=workout_user, name='Bench Press')
        se = SessionExercise.objects.create(
            session=session, exercise=exercise, order=1
        )
        s = ExerciseSet.objects.create(
            session_exercise=se,
            set_number=1,
            type='reps_weight',
            value={'reps': 10, 'weight': 60},
        )
        assert s.value == {'reps': 10, 'weight': 60}
        assert s.type == 'reps_weight'

    def test_duration_type(self, workout_user):
        session = WorkoutSession.objects.create(
            user=workout_user, date='2026-03-16', status='in_progress'
        )
        exercise = Exercise.objects.create(owner=workout_user, name='Plank')
        se = SessionExercise.objects.create(
            session=session, exercise=exercise, order=1
        )
        s = ExerciseSet.objects.create(
            session_exercise=se,
            set_number=1,
            type='duration',
            value={'seconds': 60},
        )
        assert s.value == {'seconds': 60}


class TestExerciseAPI:
    def test_list_exercises(self, auth_client):
        response = auth_client.get('/api/workout/exercises/')
        assert response.status_code == 200

    def test_create_exercise(self, auth_client):
        response = auth_client.post(
            '/api/workout/exercises/',
            {'name': 'Deadlift', 'description': 'Conventional deadlift'},
            format='json',
        )
        assert response.status_code == 201
        assert response.data['name'] == 'Deadlift'

    def test_exercises_scoped_to_user(self, auth_client, workout_user):
        from apps.core.models import CampsiteUser

        Exercise.objects.create(owner=workout_user, name='My Exercise')
        other_auth_user = CampsiteUser.objects.create_user(
            username='other', email='other@example.com', password='pass123'
        )
        # Signal auto-creates WorkoutUser
        other_wu = other_auth_user.workout_profile
        Exercise.objects.create(owner=other_wu, name='Their Exercise')
        response = auth_client.get('/api/workout/exercises/')
        names = [e['name'] for e in response.data['results']]
        assert 'My Exercise' in names
        assert 'Their Exercise' not in names


class TestWorkoutSessionAPI:
    def test_create_session_with_nested_exercises(self, auth_client, workout_user):
        exercise = Exercise.objects.create(owner=workout_user, name='Squat')
        response = auth_client.post(
            '/api/workout/sessions/',
            {
                'date': '2026-03-16',
                'status': 'in_progress',
                'exercises': [
                    {
                        'exercise': exercise.id,
                        'order': 1,
                        'sets': [
                            {
                                'set_number': 1,
                                'type': 'reps_weight',
                                'value': {'reps': 10, 'weight': 80},
                                'rest_seconds': 90,
                            },
                        ],
                    },
                ],
            },
            format='json',
        )
        assert response.status_code == 201
        assert len(response.data['exercises']) == 1
        assert len(response.data['exercises'][0]['sets']) == 1


class TestGenerateSessionAPI:
    def test_generate_session_from_plan(self, auth_client, workout_user):
        import datetime

        # Set up: plan with exercises for today's day of week
        plan = WeeklyPlan.objects.create(owner=workout_user, name='Test Plan', active=True)
        ex1 = Exercise.objects.create(owner=workout_user, name='Bench Press')
        ex2 = Exercise.objects.create(owner=workout_user, name='Squat')
        today_dow = datetime.date.today().weekday()
        PlanSlot.objects.create(
            weekly_plan=plan, day_of_week=today_dow, order=1, exercise=ex1
        )
        PlanSlot.objects.create(
            weekly_plan=plan, day_of_week=today_dow, order=2, exercise=ex2
        )

        response = auth_client.post('/api/workout/sessions/generate/', format='json')
        assert response.status_code == 201
        assert response.data['status'] == 'in_progress'
        assert len(response.data['exercises']) == 2
        names = [e['exercise_name'] for e in response.data['exercises']]
        assert 'Bench Press' in names
        assert 'Squat' in names

    def test_generate_session_from_ladder(self, auth_client, workout_user):
        import datetime

        plan = WeeklyPlan.objects.create(owner=workout_user, name='Test Plan', active=True)
        ladder = Ladder.objects.create(owner=workout_user)
        ex1 = Exercise.objects.create(owner=workout_user, name='Assisted Pull-up')
        ex2 = Exercise.objects.create(owner=workout_user, name='Pull-up')
        node1 = LadderNode.objects.create(ladder=ladder, exercise=ex1, level=1)
        LadderNode.objects.create(ladder=ladder, exercise=ex2, level=2)
        today_dow = datetime.date.today().weekday()
        PlanSlot.objects.create(
            weekly_plan=plan, day_of_week=today_dow, order=1, ladder=ladder
        )

        # No progress yet — should pick first node (Assisted Pull-up)
        response = auth_client.post('/api/workout/sessions/generate/', format='json')
        assert response.status_code == 201
        assert response.data['exercises'][0]['exercise_name'] == 'Assisted Pull-up'

        # Mark first node as achieved — should pick Pull-up
        UserNodeProgress.objects.create(
            user=workout_user, ladder_node=node1, achieved=True
        )
        # Delete the previous session first
        WorkoutSession.objects.all().delete()
        response = auth_client.post('/api/workout/sessions/generate/', format='json')
        assert response.status_code == 201
        assert response.data['exercises'][0]['exercise_name'] == 'Pull-up'

    def test_generate_session_no_plan(self, auth_client):
        response = auth_client.post('/api/workout/sessions/generate/', format='json')
        assert response.status_code == 400
        assert 'No active weekly plan' in response.data['detail']

    def test_generate_session_no_exercises_today(self, auth_client, workout_user):
        import datetime

        # Create plan with exercises only on a different day
        plan = WeeklyPlan.objects.create(owner=workout_user, name='Test Plan', active=True)
        ex = Exercise.objects.create(owner=workout_user, name='Bench Press')
        other_day = (datetime.date.today().weekday() + 1) % 7
        PlanSlot.objects.create(
            weekly_plan=plan, day_of_week=other_day, order=1, exercise=ex
        )

        response = auth_client.post('/api/workout/sessions/generate/', format='json')
        assert response.status_code == 400
        assert 'No exercises planned' in response.data['detail']


class TestDashboardAPI:
    def test_dashboard_returns_stats(self, auth_client):
        response = auth_client.get('/api/workout/dashboard/')
        assert response.status_code == 200
        assert 'total_sessions' in response.data
        assert 'completed_sessions' in response.data
        assert 'total_ladders' in response.data
        assert 'achieved_nodes' in response.data
        assert 'today_session' in response.data
        assert 'today_plan_exercises' in response.data

    def test_dashboard_shows_today_plan(self, auth_client, workout_user):
        import datetime

        plan = WeeklyPlan.objects.create(owner=workout_user, name='Test Plan', active=True)
        ex = Exercise.objects.create(owner=workout_user, name='Bench Press')
        today_dow = datetime.date.today().weekday()
        PlanSlot.objects.create(
            weekly_plan=plan, day_of_week=today_dow, order=1, exercise=ex
        )

        response = auth_client.get('/api/workout/dashboard/')
        assert response.status_code == 200
        assert len(response.data['today_plan_exercises']) == 1
        assert response.data['today_plan_exercises'][0]['exercise_name'] == 'Bench Press'
