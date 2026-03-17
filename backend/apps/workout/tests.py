import pytest
from django.core.management import call_command

from apps.workout.management.commands.seed_default_ladders import (
    LADDERS,
    STANDALONE_EXERCISES,
    WEEKLY_PLAN,
    copy_defaults_to_user,
    get_or_create_defaults_user,
)
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


class TestCriterionEvaluation:
    """Tests for the criterion evaluation engine in progression.py."""

    def _make_completed_session(self, workout_user, exercise, sets_data):
        """Helper: create a completed session with sets for a given exercise."""
        session = WorkoutSession.objects.create(
            user=workout_user, date='2026-03-17', status='completed'
        )
        se = SessionExercise.objects.create(
            session=session, exercise=exercise, order=1
        )
        for i, data in enumerate(sets_data, start=1):
            ExerciseSet.objects.create(
                session_exercise=se,
                set_number=i,
                type=data.get('type', 'reps_weight'),
                value=data['value'],
                completed=True,
            )
        return session

    def test_min_reps_sets_met(self, workout_user):
        from apps.workout.progression import evaluate_criterion

        ladder = Ladder.objects.create(owner=workout_user)
        ex = Exercise.objects.create(owner=workout_user, name='Squat')
        node = LadderNode.objects.create(ladder=ladder, exercise=ex, level=1)
        criterion = Criterion.objects.create(
            ladder_node=node, type='min_reps_sets',
            params={'sets': 3, 'reps': 10},
        )
        # 3 sets of 10+ reps in one session
        self._make_completed_session(workout_user, ex, [
            {'value': {'reps': 10, 'weight': 60}},
            {'value': {'reps': 12, 'weight': 60}},
            {'value': {'reps': 10, 'weight': 60}},
        ])
        assert evaluate_criterion(criterion, workout_user) is True

    def test_min_reps_sets_not_met(self, workout_user):
        from apps.workout.progression import evaluate_criterion

        ladder = Ladder.objects.create(owner=workout_user)
        ex = Exercise.objects.create(owner=workout_user, name='Squat')
        node = LadderNode.objects.create(ladder=ladder, exercise=ex, level=1)
        criterion = Criterion.objects.create(
            ladder_node=node, type='min_reps_sets',
            params={'sets': 3, 'reps': 10},
        )
        # Only 2 qualifying sets
        self._make_completed_session(workout_user, ex, [
            {'value': {'reps': 10, 'weight': 60}},
            {'value': {'reps': 8, 'weight': 60}},
            {'value': {'reps': 10, 'weight': 60}},
        ])
        assert evaluate_criterion(criterion, workout_user) is False

    def test_min_weight_met(self, workout_user):
        from apps.workout.progression import evaluate_criterion

        ladder = Ladder.objects.create(owner=workout_user)
        ex = Exercise.objects.create(owner=workout_user, name='Bench Press')
        node = LadderNode.objects.create(ladder=ladder, exercise=ex, level=1)
        criterion = Criterion.objects.create(
            ladder_node=node, type='min_weight',
            params={'weight': 80},
        )
        self._make_completed_session(workout_user, ex, [
            {'value': {'reps': 5, 'weight': 80}},
        ])
        assert evaluate_criterion(criterion, workout_user) is True

    def test_sustained_sessions_met(self, workout_user):
        from apps.workout.progression import evaluate_criterion

        ladder = Ladder.objects.create(owner=workout_user)
        ex = Exercise.objects.create(owner=workout_user, name='Pull-up')
        node = LadderNode.objects.create(ladder=ladder, exercise=ex, level=1)
        criterion = Criterion.objects.create(
            ladder_node=node, type='sustained_sessions',
            params={'sessions': 3, 'reps': 5},
        )
        # 3 separate completed sessions hitting 5+ reps
        for date_str in ['2026-03-14', '2026-03-15', '2026-03-16']:
            s = WorkoutSession.objects.create(
                user=workout_user, date=date_str, status='completed'
            )
            se = SessionExercise.objects.create(session=s, exercise=ex, order=1)
            ExerciseSet.objects.create(
                session_exercise=se, set_number=1,
                type='reps_only', value={'reps': 6}, completed=True,
            )
        assert evaluate_criterion(criterion, workout_user) is True

    def test_sustained_sessions_not_met(self, workout_user):
        from apps.workout.progression import evaluate_criterion

        ladder = Ladder.objects.create(owner=workout_user)
        ex = Exercise.objects.create(owner=workout_user, name='Pull-up')
        node = LadderNode.objects.create(ladder=ladder, exercise=ex, level=1)
        criterion = Criterion.objects.create(
            ladder_node=node, type='sustained_sessions',
            params={'sessions': 3, 'reps': 5},
        )
        # Only 2 sessions (not enough)
        for date_str in ['2026-03-15', '2026-03-16']:
            s = WorkoutSession.objects.create(
                user=workout_user, date=date_str, status='completed'
            )
            se = SessionExercise.objects.create(session=s, exercise=ex, order=1)
            ExerciseSet.objects.create(
                session_exercise=se, set_number=1,
                type='reps_only', value={'reps': 6}, completed=True,
            )
        assert evaluate_criterion(criterion, workout_user) is False

    def test_min_duration_met(self, workout_user):
        from apps.workout.progression import evaluate_criterion

        ladder = Ladder.objects.create(owner=workout_user)
        ex = Exercise.objects.create(owner=workout_user, name='Plank')
        node = LadderNode.objects.create(ladder=ladder, exercise=ex, level=1)
        criterion = Criterion.objects.create(
            ladder_node=node, type='min_duration',
            params={'seconds': 60},
        )
        self._make_completed_session(workout_user, ex, [
            {'type': 'duration', 'value': {'seconds': 65}},
        ])
        assert evaluate_criterion(criterion, workout_user) is True

    def test_check_node_progress_all_met(self, workout_user):
        from apps.workout.progression import check_node_progress

        ladder = Ladder.objects.create(owner=workout_user)
        ex = Exercise.objects.create(owner=workout_user, name='Squat')
        node = LadderNode.objects.create(ladder=ladder, exercise=ex, level=1)
        Criterion.objects.create(
            ladder_node=node, type='min_reps_sets',
            params={'sets': 2, 'reps': 8},
        )
        self._make_completed_session(workout_user, ex, [
            {'value': {'reps': 10, 'weight': 60}},
            {'value': {'reps': 10, 'weight': 60}},
        ])
        result = check_node_progress(node, workout_user)
        assert result['achieved'] is True
        assert result['criteria_total'] == 1

    def test_update_user_progress_marks_achieved(self, workout_user):
        from apps.workout.progression import update_user_progress

        ladder = Ladder.objects.create(owner=workout_user)
        ex = Exercise.objects.create(owner=workout_user, name='Squat')
        node = LadderNode.objects.create(ladder=ladder, exercise=ex, level=1)
        Criterion.objects.create(
            ladder_node=node, type='min_reps_sets',
            params={'sets': 1, 'reps': 5},
        )
        self._make_completed_session(workout_user, ex, [
            {'value': {'reps': 8, 'weight': 40}},
        ])
        progress = update_user_progress(node, workout_user)
        assert progress.achieved is True
        assert progress.achieved_at is not None

    def test_incomplete_session_ignored(self, workout_user):
        """Sets from in_progress sessions should not count."""
        from apps.workout.progression import evaluate_criterion

        ladder = Ladder.objects.create(owner=workout_user)
        ex = Exercise.objects.create(owner=workout_user, name='Squat')
        node = LadderNode.objects.create(ladder=ladder, exercise=ex, level=1)
        criterion = Criterion.objects.create(
            ladder_node=node, type='min_reps_sets',
            params={'sets': 1, 'reps': 5},
        )
        # in_progress session — should NOT count
        s = WorkoutSession.objects.create(
            user=workout_user, date='2026-03-17', status='in_progress'
        )
        se = SessionExercise.objects.create(session=s, exercise=ex, order=1)
        ExerciseSet.objects.create(
            session_exercise=se, set_number=1,
            type='reps_weight', value={'reps': 10, 'weight': 60}, completed=True,
        )
        assert evaluate_criterion(criterion, workout_user) is False


class TestNodeProgressAPI:
    def test_check_progress_endpoint(self, auth_client, workout_user):
        ladder = Ladder.objects.create(owner=workout_user)
        ex = Exercise.objects.create(owner=workout_user, name='Squat')
        node = LadderNode.objects.create(ladder=ladder, exercise=ex, level=1)
        Criterion.objects.create(
            ladder_node=node, type='min_reps_sets',
            params={'sets': 1, 'reps': 5},
        )

        response = auth_client.get(f'/api/workout/ladder-nodes/{node.id}/check-progress/')
        assert response.status_code == 200
        assert response.data['achieved'] is False
        assert response.data['criteria_total'] == 1

    def test_ladder_progress_endpoint(self, auth_client, workout_user):
        ladder = Ladder.objects.create(owner=workout_user)
        ex1 = Exercise.objects.create(owner=workout_user, name='Assisted Pull-up')
        ex2 = Exercise.objects.create(owner=workout_user, name='Pull-up')
        LadderNode.objects.create(ladder=ladder, exercise=ex1, level=1)
        LadderNode.objects.create(ladder=ladder, exercise=ex2, level=2)

        response = auth_client.get(f'/api/workout/ladders/{ladder.id}/progress/')
        assert response.status_code == 200
        assert len(response.data['nodes']) == 2
        assert response.data['nodes'][0]['exercise_name'] == 'Assisted Pull-up'
        assert response.data['nodes'][0]['achieved'] is False

    def test_complete_session_evaluates_progression(self, auth_client, workout_user):
        ladder = Ladder.objects.create(owner=workout_user)
        ex = Exercise.objects.create(owner=workout_user, name='Squat')
        node = LadderNode.objects.create(ladder=ladder, exercise=ex, level=1)
        Criterion.objects.create(
            ladder_node=node, type='min_reps_sets',
            params={'sets': 1, 'reps': 5},
        )

        # Create a session with a set that meets the criterion
        session = WorkoutSession.objects.create(
            user=workout_user, date='2026-03-17', status='in_progress'
        )
        se = SessionExercise.objects.create(
            session=session, exercise=ex, ladder_node=node, order=1
        )
        ExerciseSet.objects.create(
            session_exercise=se, set_number=1,
            type='reps_weight', value={'reps': 10, 'weight': 60}, completed=True,
        )

        response = auth_client.post(f'/api/workout/sessions/{session.id}/complete/')
        assert response.status_code == 200
        assert response.data['session']['status'] == 'completed'
        # The criterion should be met now (session is completed)
        assert len(response.data['progression_updates']) == 1
        assert response.data['progression_updates'][0]['exercise_name'] == 'Squat'
        assert response.data['progression_updates'][0]['achieved'] is True

        # Verify the progress was persisted
        progress = UserNodeProgress.objects.get(user=workout_user, ladder_node=node)
        assert progress.achieved is True


@pytest.mark.django_db(transaction=True)
class TestSeedDefaultLadders:
    def test_seed_creates_exercises_and_ladders(self):
        call_command('seed_default_ladders')
        defaults_user = get_or_create_defaults_user()

        # Count total unique exercises from ladder data + standalone
        ladder_exercises = {
            name for nodes in LADDERS.values() for name, *_ in nodes
        }
        expected_exercises = len(ladder_exercises) + len(STANDALONE_EXERCISES)
        assert Exercise.objects.filter(owner=defaults_user).count() == expected_exercises

        assert Ladder.objects.filter(owner=defaults_user).count() == len(LADDERS)

        # Each ladder node should have exactly one criterion
        total_nodes = sum(len(nodes) for nodes in LADDERS.values())
        assert LadderNode.objects.filter(ladder__owner=defaults_user).count() == total_nodes
        assert Criterion.objects.filter(
            ladder_node__ladder__owner=defaults_user
        ).count() == total_nodes

    def test_seed_creates_weekly_plan(self):
        call_command('seed_default_ladders')
        defaults_user = get_or_create_defaults_user()

        plans = WeeklyPlan.objects.filter(owner=defaults_user)
        assert plans.count() == 1
        assert plans.first().name == WEEKLY_PLAN["name"]

        slots = PlanSlot.objects.filter(weekly_plan=plans.first())
        assert slots.count() == len(WEEKLY_PLAN["slots"])

    def test_seed_is_idempotent(self):
        call_command('seed_default_ladders')
        call_command('seed_default_ladders')  # second call should be a no-op
        defaults_user = get_or_create_defaults_user()
        assert Ladder.objects.filter(owner=defaults_user).count() == len(LADDERS)

    def test_seed_clear_and_reseed(self):
        call_command('seed_default_ladders')
        call_command('seed_default_ladders', clear=True)
        defaults_user = get_or_create_defaults_user()
        assert Ladder.objects.filter(owner=defaults_user).count() == len(LADDERS)

    def test_ladder_prerequisites_are_linear(self):
        call_command('seed_default_ladders')
        defaults_user = get_or_create_defaults_user()

        for ladder in Ladder.objects.filter(owner=defaults_user):
            nodes = list(ladder.nodes.order_by('level'))
            for i, node in enumerate(nodes):
                if i == 0:
                    assert node.prerequisites.count() == 0
                else:
                    assert node.prerequisites.count() == 1
                    assert node.prerequisites.first() == nodes[i - 1]


@pytest.mark.django_db
class TestCopyDefaultsToUser:
    def test_copy_creates_user_data(self, workout_user):
        call_command('seed_default_ladders')
        copy_defaults_to_user(workout_user)

        ladder_exercises = {
            name for nodes in LADDERS.values() for name, *_ in nodes
        }
        expected_exercises = len(ladder_exercises) + len(STANDALONE_EXERCISES)
        assert Exercise.objects.filter(owner=workout_user).count() == expected_exercises
        assert Ladder.objects.filter(owner=workout_user).count() == len(LADDERS)
        assert WeeklyPlan.objects.filter(owner=workout_user).count() == 1

    def test_copied_ladders_are_independent(self, workout_user):
        """Editing a user's ladder should not affect the defaults."""
        call_command('seed_default_ladders')
        copy_defaults_to_user(workout_user)

        defaults_user = get_or_create_defaults_user()
        user_ladder = Ladder.objects.filter(owner=workout_user).first()
        user_ladder.nodes.first().delete()

        # Defaults should still have all nodes
        total_nodes = sum(len(nodes) for nodes in LADDERS.values())
        assert LadderNode.objects.filter(
            ladder__owner=defaults_user
        ).count() == total_nodes

    def test_copy_without_seed_is_noop(self, workout_user):
        """If seed data doesn't exist, copy should do nothing."""
        copy_defaults_to_user(workout_user)
        assert Exercise.objects.filter(owner=workout_user).count() == 0
        assert Ladder.objects.filter(owner=workout_user).count() == 0


@pytest.mark.django_db(transaction=True)
class TestSignalCopiesDefaults:
    def test_new_user_gets_default_ladders(self):
        from apps.core.models import CampsiteUser

        call_command('seed_default_ladders')

        new_user = CampsiteUser.objects.create_user(
            username='newbie', email='new@example.com', password='pass123'
        )
        workout_user = new_user.workout_profile

        assert Ladder.objects.filter(owner=workout_user).count() == len(LADDERS)
        assert WeeklyPlan.objects.filter(owner=workout_user).count() == 1
