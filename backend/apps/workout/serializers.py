from rest_framework import serializers

from .models import (
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


class WorkoutUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = WorkoutUser
        fields = ['id', 'username', 'email', 'created_at']
        read_only_fields = ['id', 'created_at']


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Criterion
        fields = ['id', 'type', 'params', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class LadderNodeSerializer(serializers.ModelSerializer):
    exercise = ExerciseSerializer(read_only=True)
    exercise_id = serializers.PrimaryKeyRelatedField(
        queryset=Exercise.objects.all(), source='exercise', write_only=True
    )
    criteria = CriterionSerializer(many=True, read_only=True)
    prerequisite_ids = serializers.PrimaryKeyRelatedField(
        queryset=LadderNode.objects.all(),
        source='prerequisites',
        many=True,
        write_only=True,
        required=False,
    )

    class Meta:
        model = LadderNode
        fields = [
            'id', 'exercise', 'exercise_id', 'level',
            'prerequisites', 'prerequisite_ids', 'criteria',
            'warmup_sets_count', 'warmup_start_pct',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LadderListSerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    node_count = serializers.IntegerField(source='nodes.count', read_only=True)

    class Meta:
        model = Ladder
        fields = ['id', 'name', 'description', 'node_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'name', 'node_count', 'created_at', 'updated_at']


class LadderDetailSerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    nodes = LadderNodeSerializer(many=True, read_only=True)

    class Meta:
        model = Ladder
        fields = ['id', 'name', 'description', 'nodes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'name', 'created_at', 'updated_at']


class UserNodeProgressSerializer(serializers.ModelSerializer):
    ladder_node_id = serializers.PrimaryKeyRelatedField(
        queryset=LadderNode.objects.all(), source='ladder_node', write_only=True
    )

    class Meta:
        model = UserNodeProgress
        fields = ['id', 'ladder_node', 'ladder_node_id', 'achieved', 'achieved_at', 'working_weight', 'updated_at']
        read_only_fields = ['id', 'ladder_node', 'updated_at']


class PlanSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanSlot
        fields = [
            'id', 'day_of_week', 'order', 'ladder', 'exercise',
            'exercise_params', 'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']

    def validate(self, data):
        if not data.get('ladder') and not data.get('exercise'):
            raise serializers.ValidationError(
                'At least one of ladder or exercise must be set.'
            )
        return data


class WeeklyPlanListSerializer(serializers.ModelSerializer):
    slot_count = serializers.IntegerField(source='slots.count', read_only=True)

    class Meta:
        model = WeeklyPlan
        fields = ['id', 'name', 'active', 'slot_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'slot_count', 'created_at', 'updated_at']


class WeeklyPlanDetailSerializer(serializers.ModelSerializer):
    slots = PlanSlotSerializer(many=True)

    class Meta:
        model = WeeklyPlan
        fields = ['id', 'name', 'active', 'slots', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        slots_data = validated_data.pop('slots', [])
        plan = WeeklyPlan.objects.create(**validated_data)
        for slot_data in slots_data:
            PlanSlot.objects.create(weekly_plan=plan, **slot_data)
        return plan

    def update(self, instance, validated_data):
        slots_data = validated_data.pop('slots', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if slots_data is not None:
            instance.slots.all().delete()
            for slot_data in slots_data:
                PlanSlot.objects.create(weekly_plan=instance, **slot_data)
        return instance


class ExerciseSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseSet
        fields = [
            'id', 'set_number', 'is_warmup_set', 'type', 'value',
            'completed', 'completed_at', 'rest_seconds', 'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']


class SessionExerciseSerializer(serializers.ModelSerializer):
    sets = ExerciseSetSerializer(many=True)
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)

    class Meta:
        model = SessionExercise
        fields = [
            'id', 'exercise', 'exercise_name', 'ladder_node',
            'order', 'is_warmup', 'warmup_duration_seconds',
            'sets', 'updated_at',
        ]
        read_only_fields = ['id', 'is_warmup', 'warmup_duration_seconds', 'updated_at']


class WorkoutSessionListSerializer(serializers.ModelSerializer):
    exercise_count = serializers.IntegerField(source='exercises.count', read_only=True)

    class Meta:
        model = WorkoutSession
        fields = [
            'id', 'date', 'started_at', 'completed_at', 'status',
            'exercise_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'exercise_count', 'created_at', 'updated_at']


class WorkoutSessionDetailSerializer(serializers.ModelSerializer):
    exercises = SessionExerciseSerializer(many=True)

    class Meta:
        model = WorkoutSession
        fields = [
            'id', 'date', 'started_at', 'completed_at', 'status',
            'exercises', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises', [])
        session = WorkoutSession.objects.create(**validated_data)
        for exercise_data in exercises_data:
            sets_data = exercise_data.pop('sets', [])
            session_exercise = SessionExercise.objects.create(
                session=session, **exercise_data
            )
            for set_data in sets_data:
                ExerciseSet.objects.create(
                    session_exercise=session_exercise, **set_data
                )
        return session

    def update(self, instance, validated_data):
        exercises_data = validated_data.pop('exercises', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if exercises_data is not None:
            # Build a lookup of existing exercises by (exercise_id, order)
            existing_map = {}
            for se in instance.exercises.all():
                existing_map[(se.exercise_id, se.order)] = se

            seen_ids = set()
            for exercise_data in exercises_data:
                sets_data = exercise_data.pop('sets', [])
                # exercise field is deserialized to a model instance by DRF
                ex = exercise_data.get('exercise')
                ex_id = ex.pk if hasattr(ex, 'pk') else ex
                key = (ex_id, exercise_data.get('order'))
                existing_se = existing_map.get(key)

                if existing_se:
                    # Update existing exercise — preserves is_warmup, warmup_duration_seconds
                    for attr, value in exercise_data.items():
                        if attr not in ('is_warmup', 'warmup_duration_seconds'):
                            setattr(existing_se, attr, value)
                    existing_se.save()
                    # Replace sets
                    existing_se.sets.all().delete()
                    for set_data in sets_data:
                        ExerciseSet.objects.create(
                            session_exercise=existing_se, **set_data
                        )
                    seen_ids.add(existing_se.id)
                else:
                    session_exercise = SessionExercise.objects.create(
                        session=instance, **exercise_data
                    )
                    for set_data in sets_data:
                        ExerciseSet.objects.create(
                            session_exercise=session_exercise, **set_data
                        )
                    seen_ids.add(session_exercise.id)

            # Remove exercises no longer in payload
            instance.exercises.exclude(id__in=seen_ids).delete()
        return instance
