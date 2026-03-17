import { baseApi as api } from "./base-api";
export const addTagTypes = ["auth", "workout"] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      authLoginCreate: build.mutation<
        AuthLoginCreateApiResponse,
        AuthLoginCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/auth/login/`,
          method: "POST",
          body: queryArg.loginRequest,
        }),
        invalidatesTags: ["auth"],
      }),
      authLogoutCreate: build.mutation<
        AuthLogoutCreateApiResponse,
        AuthLogoutCreateApiArg
      >({
        query: () => ({ url: `/api/auth/logout/`, method: "POST" }),
        invalidatesTags: ["auth"],
      }),
      authPasswordChangeCreate: build.mutation<
        AuthPasswordChangeCreateApiResponse,
        AuthPasswordChangeCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/auth/password/change/`,
          method: "POST",
          body: queryArg.passwordChangeRequest,
        }),
        invalidatesTags: ["auth"],
      }),
      authPasswordResetCreate: build.mutation<
        AuthPasswordResetCreateApiResponse,
        AuthPasswordResetCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/auth/password/reset/`,
          method: "POST",
          body: queryArg.passwordResetRequest,
        }),
        invalidatesTags: ["auth"],
      }),
      authPasswordResetConfirmCreate: build.mutation<
        AuthPasswordResetConfirmCreateApiResponse,
        AuthPasswordResetConfirmCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/auth/password/reset/confirm/`,
          method: "POST",
          body: queryArg.passwordResetConfirmRequest,
        }),
        invalidatesTags: ["auth"],
      }),
      authRegistrationCreate: build.mutation<
        AuthRegistrationCreateApiResponse,
        AuthRegistrationCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/auth/registration/`,
          method: "POST",
          body: queryArg.registerRequest,
        }),
        invalidatesTags: ["auth"],
      }),
      authRegistrationResendEmailCreate: build.mutation<
        AuthRegistrationResendEmailCreateApiResponse,
        AuthRegistrationResendEmailCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/auth/registration/resend-email/`,
          method: "POST",
          body: queryArg.resendEmailVerificationRequest,
        }),
        invalidatesTags: ["auth"],
      }),
      authRegistrationVerifyEmailCreate: build.mutation<
        AuthRegistrationVerifyEmailCreateApiResponse,
        AuthRegistrationVerifyEmailCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/auth/registration/verify-email/`,
          method: "POST",
          body: queryArg.verifyEmailRequest,
        }),
        invalidatesTags: ["auth"],
      }),
      authUserRetrieve: build.query<
        AuthUserRetrieveApiResponse,
        AuthUserRetrieveApiArg
      >({
        query: () => ({ url: `/api/auth/user/` }),
        providesTags: ["auth"],
      }),
      authUserUpdate: build.mutation<
        AuthUserUpdateApiResponse,
        AuthUserUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/auth/user/`,
          method: "PUT",
          body: queryArg.userDetailsRequest,
        }),
        invalidatesTags: ["auth"],
      }),
      authUserPartialUpdate: build.mutation<
        AuthUserPartialUpdateApiResponse,
        AuthUserPartialUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/auth/user/`,
          method: "PATCH",
          body: queryArg.patchedUserDetailsRequest,
        }),
        invalidatesTags: ["auth"],
      }),
      workoutDashboardRetrieve: build.query<
        WorkoutDashboardRetrieveApiResponse,
        WorkoutDashboardRetrieveApiArg
      >({
        query: () => ({ url: `/api/workout/dashboard/` }),
        providesTags: ["workout"],
      }),
      workoutExercisesList: build.query<
        WorkoutExercisesListApiResponse,
        WorkoutExercisesListApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/exercises/`,
          params: {
            page: queryArg.page,
          },
        }),
        providesTags: ["workout"],
      }),
      workoutExercisesCreate: build.mutation<
        WorkoutExercisesCreateApiResponse,
        WorkoutExercisesCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/exercises/`,
          method: "POST",
          body: queryArg.exerciseRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutExercisesRetrieve: build.query<
        WorkoutExercisesRetrieveApiResponse,
        WorkoutExercisesRetrieveApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/exercises/${queryArg.id}/`,
        }),
        providesTags: ["workout"],
      }),
      workoutExercisesUpdate: build.mutation<
        WorkoutExercisesUpdateApiResponse,
        WorkoutExercisesUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/exercises/${queryArg.id}/`,
          method: "PUT",
          body: queryArg.exerciseRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutExercisesPartialUpdate: build.mutation<
        WorkoutExercisesPartialUpdateApiResponse,
        WorkoutExercisesPartialUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/exercises/${queryArg.id}/`,
          method: "PATCH",
          body: queryArg.patchedExerciseRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutExercisesDestroy: build.mutation<
        WorkoutExercisesDestroyApiResponse,
        WorkoutExercisesDestroyApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/exercises/${queryArg.id}/`,
          method: "DELETE",
        }),
        invalidatesTags: ["workout"],
      }),
      workoutLadderNodesList: build.query<
        WorkoutLadderNodesListApiResponse,
        WorkoutLadderNodesListApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/ladder-nodes/`,
          params: {
            page: queryArg.page,
          },
        }),
        providesTags: ["workout"],
      }),
      workoutLadderNodesCreate: build.mutation<
        WorkoutLadderNodesCreateApiResponse,
        WorkoutLadderNodesCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/ladder-nodes/`,
          method: "POST",
          body: queryArg.ladderNodeRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutLadderNodesRetrieve: build.query<
        WorkoutLadderNodesRetrieveApiResponse,
        WorkoutLadderNodesRetrieveApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/ladder-nodes/${queryArg.id}/`,
        }),
        providesTags: ["workout"],
      }),
      workoutLadderNodesUpdate: build.mutation<
        WorkoutLadderNodesUpdateApiResponse,
        WorkoutLadderNodesUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/ladder-nodes/${queryArg.id}/`,
          method: "PUT",
          body: queryArg.ladderNodeRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutLadderNodesPartialUpdate: build.mutation<
        WorkoutLadderNodesPartialUpdateApiResponse,
        WorkoutLadderNodesPartialUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/ladder-nodes/${queryArg.id}/`,
          method: "PATCH",
          body: queryArg.patchedLadderNodeRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutLadderNodesDestroy: build.mutation<
        WorkoutLadderNodesDestroyApiResponse,
        WorkoutLadderNodesDestroyApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/ladder-nodes/${queryArg.id}/`,
          method: "DELETE",
        }),
        invalidatesTags: ["workout"],
      }),
      workoutLadderNodesCriteriaCreate: build.mutation<
        WorkoutLadderNodesCriteriaCreateApiResponse,
        WorkoutLadderNodesCriteriaCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/ladder-nodes/${queryArg.id}/criteria/`,
          method: "POST",
          body: queryArg.ladderNodeRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutLaddersList: build.query<
        WorkoutLaddersListApiResponse,
        WorkoutLaddersListApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/ladders/`,
          params: {
            page: queryArg.page,
          },
        }),
        providesTags: ["workout"],
      }),
      workoutLaddersCreate: build.mutation<
        WorkoutLaddersCreateApiResponse,
        WorkoutLaddersCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/ladders/`,
          method: "POST",
          body: queryArg.ladderDetailRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutLaddersRetrieve: build.query<
        WorkoutLaddersRetrieveApiResponse,
        WorkoutLaddersRetrieveApiArg
      >({
        query: (queryArg) => ({ url: `/api/workout/ladders/${queryArg.id}/` }),
        providesTags: ["workout"],
      }),
      workoutLaddersUpdate: build.mutation<
        WorkoutLaddersUpdateApiResponse,
        WorkoutLaddersUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/ladders/${queryArg.id}/`,
          method: "PUT",
          body: queryArg.ladderDetailRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutLaddersPartialUpdate: build.mutation<
        WorkoutLaddersPartialUpdateApiResponse,
        WorkoutLaddersPartialUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/ladders/${queryArg.id}/`,
          method: "PATCH",
          body: queryArg.patchedLadderDetailRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutLaddersDestroy: build.mutation<
        WorkoutLaddersDestroyApiResponse,
        WorkoutLaddersDestroyApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/ladders/${queryArg.id}/`,
          method: "DELETE",
        }),
        invalidatesTags: ["workout"],
      }),
      workoutPlansList: build.query<
        WorkoutPlansListApiResponse,
        WorkoutPlansListApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/plans/`,
          params: {
            page: queryArg.page,
          },
        }),
        providesTags: ["workout"],
      }),
      workoutPlansCreate: build.mutation<
        WorkoutPlansCreateApiResponse,
        WorkoutPlansCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/plans/`,
          method: "POST",
          body: queryArg.weeklyPlanDetailRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutPlansRetrieve: build.query<
        WorkoutPlansRetrieveApiResponse,
        WorkoutPlansRetrieveApiArg
      >({
        query: (queryArg) => ({ url: `/api/workout/plans/${queryArg.id}/` }),
        providesTags: ["workout"],
      }),
      workoutPlansUpdate: build.mutation<
        WorkoutPlansUpdateApiResponse,
        WorkoutPlansUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/plans/${queryArg.id}/`,
          method: "PUT",
          body: queryArg.weeklyPlanDetailRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutPlansPartialUpdate: build.mutation<
        WorkoutPlansPartialUpdateApiResponse,
        WorkoutPlansPartialUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/plans/${queryArg.id}/`,
          method: "PATCH",
          body: queryArg.patchedWeeklyPlanDetailRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutPlansDestroy: build.mutation<
        WorkoutPlansDestroyApiResponse,
        WorkoutPlansDestroyApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/plans/${queryArg.id}/`,
          method: "DELETE",
        }),
        invalidatesTags: ["workout"],
      }),
      workoutProgressList: build.query<
        WorkoutProgressListApiResponse,
        WorkoutProgressListApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/progress/`,
          params: {
            page: queryArg.page,
          },
        }),
        providesTags: ["workout"],
      }),
      workoutProgressCreate: build.mutation<
        WorkoutProgressCreateApiResponse,
        WorkoutProgressCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/progress/`,
          method: "POST",
          body: queryArg.userNodeProgressRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutProgressRetrieve: build.query<
        WorkoutProgressRetrieveApiResponse,
        WorkoutProgressRetrieveApiArg
      >({
        query: (queryArg) => ({ url: `/api/workout/progress/${queryArg.id}/` }),
        providesTags: ["workout"],
      }),
      workoutProgressUpdate: build.mutation<
        WorkoutProgressUpdateApiResponse,
        WorkoutProgressUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/progress/${queryArg.id}/`,
          method: "PUT",
          body: queryArg.userNodeProgressRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutProgressPartialUpdate: build.mutation<
        WorkoutProgressPartialUpdateApiResponse,
        WorkoutProgressPartialUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/progress/${queryArg.id}/`,
          method: "PATCH",
          body: queryArg.patchedUserNodeProgressRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutProgressDestroy: build.mutation<
        WorkoutProgressDestroyApiResponse,
        WorkoutProgressDestroyApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/progress/${queryArg.id}/`,
          method: "DELETE",
        }),
        invalidatesTags: ["workout"],
      }),
      workoutSessionsList: build.query<
        WorkoutSessionsListApiResponse,
        WorkoutSessionsListApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/sessions/`,
          params: {
            page: queryArg.page,
          },
        }),
        providesTags: ["workout"],
      }),
      workoutSessionsCreate: build.mutation<
        WorkoutSessionsCreateApiResponse,
        WorkoutSessionsCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/sessions/`,
          method: "POST",
          body: queryArg.workoutSessionDetailRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutSessionsRetrieve: build.query<
        WorkoutSessionsRetrieveApiResponse,
        WorkoutSessionsRetrieveApiArg
      >({
        query: (queryArg) => ({ url: `/api/workout/sessions/${queryArg.id}/` }),
        providesTags: ["workout"],
      }),
      workoutSessionsUpdate: build.mutation<
        WorkoutSessionsUpdateApiResponse,
        WorkoutSessionsUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/sessions/${queryArg.id}/`,
          method: "PUT",
          body: queryArg.workoutSessionDetailRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutSessionsPartialUpdate: build.mutation<
        WorkoutSessionsPartialUpdateApiResponse,
        WorkoutSessionsPartialUpdateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/sessions/${queryArg.id}/`,
          method: "PATCH",
          body: queryArg.patchedWorkoutSessionDetailRequest,
        }),
        invalidatesTags: ["workout"],
      }),
      workoutSessionsDestroy: build.mutation<
        WorkoutSessionsDestroyApiResponse,
        WorkoutSessionsDestroyApiArg
      >({
        query: (queryArg) => ({
          url: `/api/workout/sessions/${queryArg.id}/`,
          method: "DELETE",
        }),
        invalidatesTags: ["workout"],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as enhancedApi };
export type AuthLoginCreateApiResponse = /** status 200  */ Token;
export type AuthLoginCreateApiArg = {
  loginRequest: LoginRequest;
};
export type AuthLogoutCreateApiResponse = /** status 200  */ RestAuthDetailRead;
export type AuthLogoutCreateApiArg = void;
export type AuthPasswordChangeCreateApiResponse =
  /** status 200  */ RestAuthDetailRead;
export type AuthPasswordChangeCreateApiArg = {
  passwordChangeRequest: PasswordChangeRequest;
};
export type AuthPasswordResetCreateApiResponse =
  /** status 200  */ RestAuthDetailRead;
export type AuthPasswordResetCreateApiArg = {
  passwordResetRequest: PasswordResetRequest;
};
export type AuthPasswordResetConfirmCreateApiResponse =
  /** status 200  */ RestAuthDetailRead;
export type AuthPasswordResetConfirmCreateApiArg = {
  passwordResetConfirmRequest: PasswordResetConfirmRequest;
};
export type AuthRegistrationCreateApiResponse = /** status 201  */ Token;
export type AuthRegistrationCreateApiArg = {
  registerRequest: RegisterRequestWrite;
};
export type AuthRegistrationResendEmailCreateApiResponse =
  /** status 201  */ RestAuthDetailRead;
export type AuthRegistrationResendEmailCreateApiArg = {
  resendEmailVerificationRequest: ResendEmailVerificationRequest;
};
export type AuthRegistrationVerifyEmailCreateApiResponse =
  /** status 200  */ RestAuthDetailRead;
export type AuthRegistrationVerifyEmailCreateApiArg = {
  verifyEmailRequest: VerifyEmailRequestWrite;
};
export type AuthUserRetrieveApiResponse = /** status 200  */ UserDetailsRead;
export type AuthUserRetrieveApiArg = void;
export type AuthUserUpdateApiResponse = /** status 200  */ UserDetailsRead;
export type AuthUserUpdateApiArg = {
  userDetailsRequest: UserDetailsRequest;
};
export type AuthUserPartialUpdateApiResponse =
  /** status 200  */ UserDetailsRead;
export type AuthUserPartialUpdateApiArg = {
  patchedUserDetailsRequest: PatchedUserDetailsRequest;
};
export type WorkoutDashboardRetrieveApiResponse = unknown;
export type WorkoutDashboardRetrieveApiArg = void;
export type WorkoutExercisesListApiResponse =
  /** status 200  */ PaginatedExerciseListRead;
export type WorkoutExercisesListApiArg = {
  /** A page number within the paginated result set. */
  page?: number;
};
export type WorkoutExercisesCreateApiResponse = /** status 201  */ ExerciseRead;
export type WorkoutExercisesCreateApiArg = {
  exerciseRequest: ExerciseRequest;
};
export type WorkoutExercisesRetrieveApiResponse =
  /** status 200  */ ExerciseRead;
export type WorkoutExercisesRetrieveApiArg = {
  id: string;
};
export type WorkoutExercisesUpdateApiResponse = /** status 200  */ ExerciseRead;
export type WorkoutExercisesUpdateApiArg = {
  id: string;
  exerciseRequest: ExerciseRequest;
};
export type WorkoutExercisesPartialUpdateApiResponse =
  /** status 200  */ ExerciseRead;
export type WorkoutExercisesPartialUpdateApiArg = {
  id: string;
  patchedExerciseRequest: PatchedExerciseRequest;
};
export type WorkoutExercisesDestroyApiResponse = unknown;
export type WorkoutExercisesDestroyApiArg = {
  id: string;
};
export type WorkoutLadderNodesListApiResponse =
  /** status 200  */ PaginatedLadderNodeListRead;
export type WorkoutLadderNodesListApiArg = {
  /** A page number within the paginated result set. */
  page?: number;
};
export type WorkoutLadderNodesCreateApiResponse =
  /** status 201  */ LadderNodeRead;
export type WorkoutLadderNodesCreateApiArg = {
  ladderNodeRequest: LadderNodeRequestWrite;
};
export type WorkoutLadderNodesRetrieveApiResponse =
  /** status 200  */ LadderNodeRead;
export type WorkoutLadderNodesRetrieveApiArg = {
  id: string;
};
export type WorkoutLadderNodesUpdateApiResponse =
  /** status 200  */ LadderNodeRead;
export type WorkoutLadderNodesUpdateApiArg = {
  id: string;
  ladderNodeRequest: LadderNodeRequestWrite;
};
export type WorkoutLadderNodesPartialUpdateApiResponse =
  /** status 200  */ LadderNodeRead;
export type WorkoutLadderNodesPartialUpdateApiArg = {
  id: string;
  patchedLadderNodeRequest: PatchedLadderNodeRequestWrite;
};
export type WorkoutLadderNodesDestroyApiResponse = unknown;
export type WorkoutLadderNodesDestroyApiArg = {
  id: string;
};
export type WorkoutLadderNodesCriteriaCreateApiResponse =
  /** status 200  */ LadderNodeRead;
export type WorkoutLadderNodesCriteriaCreateApiArg = {
  id: string;
  ladderNodeRequest: LadderNodeRequestWrite;
};
export type WorkoutLaddersListApiResponse =
  /** status 200  */ PaginatedLadderListListRead;
export type WorkoutLaddersListApiArg = {
  /** A page number within the paginated result set. */
  page?: number;
};
export type WorkoutLaddersCreateApiResponse =
  /** status 201  */ LadderDetailRead;
export type WorkoutLaddersCreateApiArg = {
  ladderDetailRequest: LadderDetailRequest;
};
export type WorkoutLaddersRetrieveApiResponse =
  /** status 200  */ LadderDetailRead;
export type WorkoutLaddersRetrieveApiArg = {
  id: string;
};
export type WorkoutLaddersUpdateApiResponse =
  /** status 200  */ LadderDetailRead;
export type WorkoutLaddersUpdateApiArg = {
  id: string;
  ladderDetailRequest: LadderDetailRequest;
};
export type WorkoutLaddersPartialUpdateApiResponse =
  /** status 200  */ LadderDetailRead;
export type WorkoutLaddersPartialUpdateApiArg = {
  id: string;
  patchedLadderDetailRequest: PatchedLadderDetailRequest;
};
export type WorkoutLaddersDestroyApiResponse = unknown;
export type WorkoutLaddersDestroyApiArg = {
  id: string;
};
export type WorkoutPlansListApiResponse =
  /** status 200  */ PaginatedWeeklyPlanListListRead;
export type WorkoutPlansListApiArg = {
  /** A page number within the paginated result set. */
  page?: number;
};
export type WorkoutPlansCreateApiResponse =
  /** status 201  */ WeeklyPlanDetailRead;
export type WorkoutPlansCreateApiArg = {
  weeklyPlanDetailRequest: WeeklyPlanDetailRequest;
};
export type WorkoutPlansRetrieveApiResponse =
  /** status 200  */ WeeklyPlanDetailRead;
export type WorkoutPlansRetrieveApiArg = {
  id: string;
};
export type WorkoutPlansUpdateApiResponse =
  /** status 200  */ WeeklyPlanDetailRead;
export type WorkoutPlansUpdateApiArg = {
  id: string;
  weeklyPlanDetailRequest: WeeklyPlanDetailRequest;
};
export type WorkoutPlansPartialUpdateApiResponse =
  /** status 200  */ WeeklyPlanDetailRead;
export type WorkoutPlansPartialUpdateApiArg = {
  id: string;
  patchedWeeklyPlanDetailRequest: PatchedWeeklyPlanDetailRequest;
};
export type WorkoutPlansDestroyApiResponse = unknown;
export type WorkoutPlansDestroyApiArg = {
  id: string;
};
export type WorkoutProgressListApiResponse =
  /** status 200  */ PaginatedUserNodeProgressListRead;
export type WorkoutProgressListApiArg = {
  /** A page number within the paginated result set. */
  page?: number;
};
export type WorkoutProgressCreateApiResponse =
  /** status 201  */ UserNodeProgressRead;
export type WorkoutProgressCreateApiArg = {
  userNodeProgressRequest: UserNodeProgressRequestWrite;
};
export type WorkoutProgressRetrieveApiResponse =
  /** status 200  */ UserNodeProgressRead;
export type WorkoutProgressRetrieveApiArg = {
  id: string;
};
export type WorkoutProgressUpdateApiResponse =
  /** status 200  */ UserNodeProgressRead;
export type WorkoutProgressUpdateApiArg = {
  id: string;
  userNodeProgressRequest: UserNodeProgressRequestWrite;
};
export type WorkoutProgressPartialUpdateApiResponse =
  /** status 200  */ UserNodeProgressRead;
export type WorkoutProgressPartialUpdateApiArg = {
  id: string;
  patchedUserNodeProgressRequest: PatchedUserNodeProgressRequestWrite;
};
export type WorkoutProgressDestroyApiResponse = unknown;
export type WorkoutProgressDestroyApiArg = {
  id: string;
};
export type WorkoutSessionsListApiResponse =
  /** status 200  */ PaginatedWorkoutSessionListListRead;
export type WorkoutSessionsListApiArg = {
  /** A page number within the paginated result set. */
  page?: number;
};
export type WorkoutSessionsCreateApiResponse =
  /** status 201  */ WorkoutSessionDetailRead;
export type WorkoutSessionsCreateApiArg = {
  workoutSessionDetailRequest: WorkoutSessionDetailRequest;
};
export type WorkoutSessionsRetrieveApiResponse =
  /** status 200  */ WorkoutSessionDetailRead;
export type WorkoutSessionsRetrieveApiArg = {
  id: string;
};
export type WorkoutSessionsUpdateApiResponse =
  /** status 200  */ WorkoutSessionDetailRead;
export type WorkoutSessionsUpdateApiArg = {
  id: string;
  workoutSessionDetailRequest: WorkoutSessionDetailRequest;
};
export type WorkoutSessionsPartialUpdateApiResponse =
  /** status 200  */ WorkoutSessionDetailRead;
export type WorkoutSessionsPartialUpdateApiArg = {
  id: string;
  patchedWorkoutSessionDetailRequest: PatchedWorkoutSessionDetailRequest;
};
export type WorkoutSessionsDestroyApiResponse = unknown;
export type WorkoutSessionsDestroyApiArg = {
  id: string;
};
export type Token = {
  key: string;
};
export type LoginRequest = {
  username?: string;
  email?: string;
  password: string;
};
export type RestAuthDetail = {};
export type RestAuthDetailRead = {
  detail?: string;
};
export type PasswordChangeRequest = {
  new_password1: string;
  new_password2: string;
};
export type PasswordResetRequest = {
  email: string;
};
export type PasswordResetConfirmRequest = {
  new_password1: string;
  new_password2: string;
  uid: string;
  token: string;
};
export type RegisterRequest = {
  username: string;
  email: string;
};
export type RegisterRequestWrite = {
  username: string;
  email: string;
  password1: string;
  password2: string;
};
export type ResendEmailVerificationRequest = {
  email: string;
};
export type VerifyEmailRequest = {};
export type VerifyEmailRequestWrite = {
  key: string;
};
export type UserDetails = {
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username: string;
  first_name?: string;
  last_name?: string;
};
export type UserDetailsRead = {
  pk?: number;
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};
export type UserDetailsRequest = {
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username: string;
  first_name?: string;
  last_name?: string;
};
export type PatchedUserDetailsRequest = {
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username?: string;
  first_name?: string;
  last_name?: string;
};
export type Exercise = {
  name: string;
  description?: string;
};
export type ExerciseRead = {
  id?: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
};
export type PaginatedExerciseList = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: Exercise[];
};
export type PaginatedExerciseListRead = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: ExerciseRead[];
};
export type ExerciseRequest = {
  name: string;
  description?: string;
};
export type PatchedExerciseRequest = {
  name?: string;
  description?: string;
};
export type LadderNode = {
  /** Tier in the tree (for display ordering) */
  level: number;
  prerequisites?: number[];
};
export type CriterionTypeEnum =
  | "min_reps_sets"
  | "min_weight"
  | "sustained_sessions"
  | "min_duration";
export type Criterion = {
  type: CriterionTypeEnum;
  /** Shape determined by type, e.g. {"sets": 3, "reps": 10} */
  params: any;
};
export type CriterionRead = {
  id?: number;
  type: CriterionTypeEnum;
  /** Shape determined by type, e.g. {"sets": 3, "reps": 10} */
  params: any;
  created_at?: string;
  updated_at?: string;
};
export type LadderNodeRead = {
  id?: number;
  exercise?: ExerciseRead;
  /** Tier in the tree (for display ordering) */
  level: number;
  prerequisites?: number[];
  criteria?: CriterionRead[];
  created_at?: string;
  updated_at?: string;
};
export type PaginatedLadderNodeList = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: LadderNode[];
};
export type PaginatedLadderNodeListRead = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: LadderNodeRead[];
};
export type LadderNodeRequest = {
  /** Tier in the tree (for display ordering) */
  level: number;
  prerequisites?: number[];
};
export type LadderNodeRequestWrite = {
  exercise_id: number;
  /** Tier in the tree (for display ordering) */
  level: number;
  prerequisites?: number[];
  prerequisite_ids?: number[];
};
export type PatchedLadderNodeRequest = {
  /** Tier in the tree (for display ordering) */
  level?: number;
  prerequisites?: number[];
};
export type PatchedLadderNodeRequestWrite = {
  exercise_id?: number;
  /** Tier in the tree (for display ordering) */
  level?: number;
  prerequisites?: number[];
  prerequisite_ids?: number[];
};
export type LadderList = {
  description?: string;
};
export type LadderListRead = {
  id?: number;
  name?: string;
  description?: string;
  node_count?: number;
  created_at?: string;
  updated_at?: string;
};
export type PaginatedLadderListList = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: LadderList[];
};
export type PaginatedLadderListListRead = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: LadderListRead[];
};
export type LadderDetail = {
  description?: string;
};
export type LadderDetailRead = {
  id?: number;
  name?: string;
  description?: string;
  nodes?: LadderNodeRead[];
  created_at?: string;
  updated_at?: string;
};
export type LadderDetailRequest = {
  description?: string;
};
export type PatchedLadderDetailRequest = {
  description?: string;
};
export type WeeklyPlanList = {
  name: string;
  active?: boolean;
};
export type WeeklyPlanListRead = {
  id?: number;
  name: string;
  active?: boolean;
  slot_count?: number;
  created_at?: string;
  updated_at?: string;
};
export type PaginatedWeeklyPlanListList = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: WeeklyPlanList[];
};
export type PaginatedWeeklyPlanListListRead = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: WeeklyPlanListRead[];
};
export type DayOfWeekEnum = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type PlanSlot = {
  day_of_week: DayOfWeekEnum;
  order: number;
  ladder?: number | null;
  exercise?: number | null;
  /** Typed params, e.g. {"type": "reps_weight", "sets": 4, "reps": 8, "weight": 20} */
  exercise_params?: any | null;
};
export type PlanSlotRead = {
  id?: number;
  day_of_week: DayOfWeekEnum;
  order: number;
  ladder?: number | null;
  exercise?: number | null;
  /** Typed params, e.g. {"type": "reps_weight", "sets": 4, "reps": 8, "weight": 20} */
  exercise_params?: any | null;
  updated_at?: string;
};
export type WeeklyPlanDetail = {
  name: string;
  active?: boolean;
  slots: PlanSlot[];
};
export type WeeklyPlanDetailRead = {
  id?: number;
  name: string;
  active?: boolean;
  slots: PlanSlotRead[];
  created_at?: string;
  updated_at?: string;
};
export type PlanSlotRequest = {
  day_of_week: DayOfWeekEnum;
  order: number;
  ladder?: number | null;
  exercise?: number | null;
  /** Typed params, e.g. {"type": "reps_weight", "sets": 4, "reps": 8, "weight": 20} */
  exercise_params?: any | null;
};
export type WeeklyPlanDetailRequest = {
  name: string;
  active?: boolean;
  slots: PlanSlotRequest[];
};
export type PatchedWeeklyPlanDetailRequest = {
  name?: string;
  active?: boolean;
  slots?: PlanSlotRequest[];
};
export type UserNodeProgress = {
  achieved?: boolean;
  achieved_at?: string | null;
};
export type UserNodeProgressRead = {
  id?: number;
  ladder_node?: number;
  achieved?: boolean;
  achieved_at?: string | null;
  updated_at?: string;
};
export type PaginatedUserNodeProgressList = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: UserNodeProgress[];
};
export type PaginatedUserNodeProgressListRead = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: UserNodeProgressRead[];
};
export type UserNodeProgressRequest = {
  achieved?: boolean;
  achieved_at?: string | null;
};
export type UserNodeProgressRequestWrite = {
  ladder_node_id: number;
  achieved?: boolean;
  achieved_at?: string | null;
};
export type PatchedUserNodeProgressRequest = {
  achieved?: boolean;
  achieved_at?: string | null;
};
export type PatchedUserNodeProgressRequestWrite = {
  ladder_node_id?: number;
  achieved?: boolean;
  achieved_at?: string | null;
};
export type StatusEnum = "planned" | "in_progress" | "completed" | "skipped";
export type WorkoutSessionList = {
  date: string;
  started_at?: string | null;
  completed_at?: string | null;
  status?: StatusEnum;
};
export type WorkoutSessionListRead = {
  id?: number;
  date: string;
  started_at?: string | null;
  completed_at?: string | null;
  status?: StatusEnum;
  exercise_count?: number;
  created_at?: string;
  updated_at?: string;
};
export type PaginatedWorkoutSessionListList = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: WorkoutSessionList[];
};
export type PaginatedWorkoutSessionListListRead = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: WorkoutSessionListRead[];
};
export type ExerciseSetTypeEnum =
  | "reps_weight"
  | "reps_only"
  | "duration"
  | "distance";
export type ExerciseSet = {
  set_number: number;
  type: ExerciseSetTypeEnum;
  /** Shape determined by type, e.g. {"reps": 10, "weight": 20} */
  value: any;
  completed?: boolean;
  completed_at?: string | null;
  rest_seconds?: number;
};
export type ExerciseSetRead = {
  id?: number;
  set_number: number;
  type: ExerciseSetTypeEnum;
  /** Shape determined by type, e.g. {"reps": 10, "weight": 20} */
  value: any;
  completed?: boolean;
  completed_at?: string | null;
  rest_seconds?: number;
  updated_at?: string;
};
export type SessionExercise = {
  exercise: number;
  ladder_node?: number | null;
  order: number;
  sets: ExerciseSet[];
};
export type SessionExerciseRead = {
  id?: number;
  exercise: number;
  exercise_name?: string;
  ladder_node?: number | null;
  order: number;
  sets: ExerciseSetRead[];
  updated_at?: string;
};
export type WorkoutSessionDetail = {
  date: string;
  started_at?: string | null;
  completed_at?: string | null;
  status?: StatusEnum;
  exercises: SessionExercise[];
};
export type WorkoutSessionDetailRead = {
  id?: number;
  date: string;
  started_at?: string | null;
  completed_at?: string | null;
  status?: StatusEnum;
  exercises: SessionExerciseRead[];
  created_at?: string;
  updated_at?: string;
};
export type ExerciseSetRequest = {
  set_number: number;
  type: ExerciseSetTypeEnum;
  /** Shape determined by type, e.g. {"reps": 10, "weight": 20} */
  value: any;
  completed?: boolean;
  completed_at?: string | null;
  rest_seconds?: number;
};
export type SessionExerciseRequest = {
  exercise: number;
  ladder_node?: number | null;
  order: number;
  sets: ExerciseSetRequest[];
};
export type WorkoutSessionDetailRequest = {
  date: string;
  started_at?: string | null;
  completed_at?: string | null;
  status?: StatusEnum;
  exercises: SessionExerciseRequest[];
};
export type PatchedWorkoutSessionDetailRequest = {
  date?: string;
  started_at?: string | null;
  completed_at?: string | null;
  status?: StatusEnum;
  exercises?: SessionExerciseRequest[];
};
export const {
  useAuthLoginCreateMutation,
  useAuthLogoutCreateMutation,
  useAuthPasswordChangeCreateMutation,
  useAuthPasswordResetCreateMutation,
  useAuthPasswordResetConfirmCreateMutation,
  useAuthRegistrationCreateMutation,
  useAuthRegistrationResendEmailCreateMutation,
  useAuthRegistrationVerifyEmailCreateMutation,
  useAuthUserRetrieveQuery,
  useAuthUserUpdateMutation,
  useAuthUserPartialUpdateMutation,
  useWorkoutDashboardRetrieveQuery,
  useWorkoutExercisesListQuery,
  useWorkoutExercisesCreateMutation,
  useWorkoutExercisesRetrieveQuery,
  useWorkoutExercisesUpdateMutation,
  useWorkoutExercisesPartialUpdateMutation,
  useWorkoutExercisesDestroyMutation,
  useWorkoutLadderNodesListQuery,
  useWorkoutLadderNodesCreateMutation,
  useWorkoutLadderNodesRetrieveQuery,
  useWorkoutLadderNodesUpdateMutation,
  useWorkoutLadderNodesPartialUpdateMutation,
  useWorkoutLadderNodesDestroyMutation,
  useWorkoutLadderNodesCriteriaCreateMutation,
  useWorkoutLaddersListQuery,
  useWorkoutLaddersCreateMutation,
  useWorkoutLaddersRetrieveQuery,
  useWorkoutLaddersUpdateMutation,
  useWorkoutLaddersPartialUpdateMutation,
  useWorkoutLaddersDestroyMutation,
  useWorkoutPlansListQuery,
  useWorkoutPlansCreateMutation,
  useWorkoutPlansRetrieveQuery,
  useWorkoutPlansUpdateMutation,
  useWorkoutPlansPartialUpdateMutation,
  useWorkoutPlansDestroyMutation,
  useWorkoutProgressListQuery,
  useWorkoutProgressCreateMutation,
  useWorkoutProgressRetrieveQuery,
  useWorkoutProgressUpdateMutation,
  useWorkoutProgressPartialUpdateMutation,
  useWorkoutProgressDestroyMutation,
  useWorkoutSessionsListQuery,
  useWorkoutSessionsCreateMutation,
  useWorkoutSessionsRetrieveQuery,
  useWorkoutSessionsUpdateMutation,
  useWorkoutSessionsPartialUpdateMutation,
  useWorkoutSessionsDestroyMutation,
} = injectedRtkApi;
