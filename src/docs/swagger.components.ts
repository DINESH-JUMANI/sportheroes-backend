/**
 * @openapi
 * components:
 *   schemas:
 *     ErrorBody:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           example: VALIDATION_ERROR
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               path:
 *                 type: string
 *               message:
 *                 type: string
 *
 *     SuccessResponse:
 *       type: object
 *       required: [success, message, data]
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           description: Human-readable message for FE modals / toasts
 *           example: Match created
 *         data:
 *           description: Payload (object, list wrapper, or null)
 *           nullable: true
 *
 *     ErrorResponse:
 *       type: object
 *       required: [success, message, data]
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           description: Human-readable message for FE modals / toasts
 *           example: Validation failed
 *         data:
 *           nullable: true
 *           example: null
 *         error:
 *           $ref: '#/components/schemas/ErrorBody'
 *
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         total:
 *           type: integer
 *           example: 42
 *         totalPages:
 *           type: integer
 *           example: 3
 *
 *     MatchFormat:
 *       type: object
 *       properties:
 *         sets_to_win:
 *           type: integer
 *           example: 3
 *         best_of_sets:
 *           type: integer
 *           example: 5
 *         points_per_set:
 *           type: integer
 *           example: 11
 *         win_by_margin:
 *           type: integer
 *           example: 2
 *         deuce_enabled:
 *           type: boolean
 *           example: true
 *
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           nullable: true
 *         phoneNumber:
 *           type: string
 *           nullable: true
 *         fullName:
 *           type: string
 *         hasPassword:
 *           type: boolean
 *           description: false until set-password for placeholder users
 *         displayName:
 *           type: string
 *           nullable: true
 *         profilePictureUrl:
 *           type: string
 *           nullable: true
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           nullable: true
 *         gender:
 *           type: string
 *           enum: [male, female, other, prefer_not_to_say]
 *           nullable: true
 *         city:
 *           type: string
 *           nullable: true
 *         state:
 *           type: string
 *           nullable: true
 *         country:
 *           type: string
 *           nullable: true
 *         isActive:
 *           type: boolean
 *         isProfileComplete:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     AuthTokens:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         tokenType:
 *           type: string
 *           example: Bearer
 *         expiresIn:
 *           type: string
 *           example: 7d
 *         expiresAt:
 *           type: string
 *           format: date-time
 *
 *     Sport:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         iconUrl:
 *           type: string
 *           nullable: true
 *         description:
 *           type: string
 *           nullable: true
 *         isTeamSport:
 *           type: boolean
 *         defaultMatchFormat:
 *           $ref: '#/components/schemas/MatchFormat'
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PlayerSportProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         sportId:
 *           type: string
 *           format: uuid
 *         skillLevel:
 *           type: string
 *           enum: [beginner, intermediate, advanced, professional]
 *         rankingPoints:
 *           type: integer
 *         isPrimarySport:
 *           type: boolean
 *         sport:
 *           $ref: '#/components/schemas/Sport'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     TeamMember:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         role:
 *           type: string
 *           enum: [admin, captain, vice_captain, member]
 *         joinedAt:
 *           type: string
 *           format: date-time
 *         leftAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         isActive:
 *           type: boolean
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             fullName:
 *               type: string
 *             displayName:
 *               type: string
 *               nullable: true
 *             profilePictureUrl:
 *               type: string
 *               nullable: true
 *
 *     Team:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         shortName:
 *           type: string
 *           nullable: true
 *         logoUrl:
 *           type: string
 *           nullable: true
 *         hasLogo:
 *           type: boolean
 *         logoMimeType:
 *           type: string
 *           nullable: true
 *         description:
 *           type: string
 *           nullable: true
 *         captainId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         viceCaptainId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         createdBy:
 *           type: string
 *           format: uuid
 *         isActive:
 *           type: boolean
 *         members:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TeamMember'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Tournament:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         sportId:
 *           type: string
 *           format: uuid
 *         organizerId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         format:
 *           type: string
 *           enum: [league, round_robin, knockout]
 *         participantKind:
 *           type: string
 *           enum: [individual, team]
 *         bannerUrl:
 *           type: string
 *           nullable: true
 *         description:
 *           type: string
 *           nullable: true
 *         venue:
 *           type: string
 *           nullable: true
 *         city:
 *           type: string
 *           nullable: true
 *         state:
 *           type: string
 *           nullable: true
 *         country:
 *           type: string
 *           nullable: true
 *         registrationStartDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         registrationEndDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         maxParticipants:
 *           type: integer
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [draft, registration_open, registration_closed, ongoing, completed, cancelled]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     TournamentParticipant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         tournamentId:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         teamId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         seedNumber:
 *           type: integer
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [registered, confirmed, withdrawn, disqualified]
 *         registeredAt:
 *           type: string
 *           format: date-time
 *
 *     TournamentRound:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         tournamentId:
 *           type: string
 *           format: uuid
 *         roundNumber:
 *           type: integer
 *         roundName:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     TournamentStanding:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         tournamentId:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         teamId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         matchesPlayed:
 *           type: integer
 *         wins:
 *           type: integer
 *         losses:
 *           type: integer
 *         points:
 *           type: integer
 *         position:
 *           type: integer
 *           nullable: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     MatchParticipant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         side:
 *           type: string
 *           enum: [A, B]
 *         userId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         teamId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         isWinner:
 *           type: boolean
 *         user:
 *           type: object
 *           nullable: true
 *         team:
 *           type: object
 *           nullable: true
 *
 *     MatchSet:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         setNumber:
 *           type: integer
 *         sideAScore:
 *           type: integer
 *         sideBScore:
 *           type: integer
 *         winnerSide:
 *           type: string
 *           enum: [A, B]
 *           nullable: true
 *         startedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         endedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *
 *     MatchPoint:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         pointNumber:
 *           type: integer
 *         scoringSide:
 *           type: string
 *           enum: [A, B]
 *         sideAScoreAfter:
 *           type: integer
 *         sideBScoreAfter:
 *           type: integer
 *         isUndone:
 *           type: boolean
 *         recordedBy:
 *           type: string
 *           format: uuid
 *         recordedAt:
 *           type: string
 *           format: date-time
 *
 *     Match:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         sportId:
 *           type: string
 *           format: uuid
 *         tournamentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         tournamentRoundId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         matchType:
 *           type: string
 *           enum: [singles, doubles, team]
 *         matchFormat:
 *           $ref: '#/components/schemas/MatchFormat'
 *         venue:
 *           type: string
 *           nullable: true
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         startedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         finishedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [scheduled, ongoing, paused, completed, cancelled]
 *         winnerSide:
 *           type: string
 *           enum: [A, B]
 *           nullable: true
 *         createdBy:
 *           type: string
 *           format: uuid
 *         participants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MatchParticipant'
 *         sets:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MatchSet'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PlayerStatistics:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         sportId:
 *           type: string
 *           format: uuid
 *         matchesPlayed:
 *           type: integer
 *         matchesWon:
 *           type: integer
 *         matchesLost:
 *           type: integer
 *         setsWon:
 *           type: integer
 *         setsLost:
 *           type: integer
 *         totalPointsScored:
 *           type: integer
 *         totalPointsConceded:
 *           type: integer
 *         winPercentage:
 *           type: number
 *         currentRankingPoints:
 *           type: integer
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     TeamStatistics:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         teamId:
 *           type: string
 *           format: uuid
 *         matchesPlayed:
 *           type: integer
 *         matchesWon:
 *           type: integer
 *         matchesLost:
 *           type: integer
 *         setsWon:
 *           type: integer
 *         setsLost:
 *           type: integer
 *         winPercentage:
 *           type: number
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *   responses:
 *     BadRequest:
 *       description: Validation error or bad request
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             error:
 *               code: VALIDATION_ERROR
 *               message: Validation failed
 *               details:
 *                 - path: sportId
 *                   message: Invalid sportId
 *
 *     Unauthorized:
 *       description: Missing or invalid Bearer token
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             error:
 *               code: UNAUTHORIZED
 *               message: Missing or invalid Authorization header
 *
 *     Forbidden:
 *       description: Authenticated but not allowed
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             error:
 *               code: FORBIDDEN
 *               message: Only the tournament organizer can perform this action
 *
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             error:
 *               code: NOT_FOUND
 *               message: Resource not found
 *
 *     Conflict:
 *       description: Resource conflict
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             error:
 *               code: CONFLICT
 *               message: Player already has a profile for this sport
 *
 *     InternalError:
 *       description: Unexpected server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             error:
 *               code: INTERNAL_SERVER_ERROR
 *               message: An unexpected error occurred
 */

export {};
