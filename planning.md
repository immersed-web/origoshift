# Inclubit 360 version 2

## Glossary / phrasing explanations
**"Camera Station"**: This refers to a computer or laptop physically (with e.g. usb-cable) connected to a 360 camera.

## Important notes/disclaimer
- RISE will host the application(s) during the course of the project. RISE doesn't take on the responsibility to host and/or maintain the applications after the project is completed. Rise will, though, create the application(s) in such a way (along with documentation and instructions), that it should be easy for an it-technician or sysadmin to setup and install the application(s) on a system (web server).
- The resulting application(s) will be published as Open Source Software under a GPL-3.0 License


## Common parts
### Core
- SFU media server (SFU = Selective Forwarding Unit)
  - [40h] infrastructure for many to many media streams.
  - [40h] Possibility (for admins and/or users depending on config) to create rooms. A room can have many senders and many receivers. One client can (technically) both send and receive at the same time.
  - [40h] Can handle streaming from some ( < 10 ) sender-clients to many ( ~50 ) receiver-clients simultaneously. Each receiver only receives one stream at a time.
  <!-- - [20h] Receiveing clients can switch/choose between the sending streams. -->
  - [40h] Clients can jump between rooms.


- [20h] Possibility to send 360 video to the media server. For **each** "camera station" the following is required:
  - A laptop/computer with fast internet connection.
  - A 360 camera that supports to be connected to a computer and show up as a "web camera" (Example: Ricoh Theta Z). **Note** that this is different from the common feature of many 360 cameras to stream directly to facebook or youtube.

- [60h] Backend that handles authentication and permissions for users with different roles as well as the admin account
  - admin can create and edit user accounts

**Total for Core functionality:** 240h

### Extravaganza
- [60h] Testing methdodology in place for measuring the load capability of the application.

- [60h] Scalable to accomodate a larger amount of simultaneous clients. If the number of connected clients become large the application will create new separate processes on the server(s) to scale up the applications ability to handle the larger number of concurrent users.





## School track
### Core
- [10h] Each camera station is assigned a separate room.

- [15h] The camera station shows a list of the student(s) currently in that room.

- [15h] Students can "raise a hand" and this will be visualized with a hand emoji on that room's camera station.

- [20h] A special user type/role for teachers. Teachers can create new student users.

- [60h] Teachers can join a room from a separate computer. From this computer the teacher can share his/her screen (without sound).
  - The shared screen capture is vizualized as a "hovering frame" inside the VR environment for the students.

- [40h] Camera stations have functionality for covering parts of the viewing angle with black color. What part is covered is controlled from the camera station, but the processing is performed client-side at the receivers. The implication of this is that the whole video frame (including the censored parts) always is transmitted to the receivers.

**Total for core functionality:** 160h

### Extravaganza
- [100h] Camera stations visualizes the students currently in the room as 3D-heads that turn according to the students orientation wearing the VR-headset.

- [20h] Teacher can also share sound when sharing his/her screen.

- [20h] The teacher's shared screen capture frame can be repositioned by the students inside their VR environment using the hand controllers of the VR-headset.

- [60h] Perform the censor processing on the sender side in the camera station. This would increase the alignment with integrity requirements.


## Culture Track
### Core
- [10h] Each camera station is assigned a separate room.

- [60] An admin can create an event that will be used to stream a live show/performance.
  - The event has an associated start time and date.

- [80h] An admin can generate a set (max 50) of unique urls that gives access to an event.
  - The unique urls should be regarded as a personal ticket and each can only be used from one device at a time. That is, if two persons tries to visit the same unique url from different devices the first person that enters will get access and the second person will fail.
  - A visitor can use their unique url to see the show.
  - If they arrive before the event has started they are shown a countdown timer.
  - If a client tries to use an url that is already inside the event, they will receive some helpful feedback that the ticket-url is already connected and in use. Perhaps they have several tabs and/or devices active?

- [20h] An admin can get an overview of the number of clients currently connected to the event (audience size).

**Total for core functionality:** 170h

### Extravaganza
- [100h] Admin can from within the VR-environment assign relative directions of the different camera stations in relation to each other.
  - Users can switch camera angles by looking at a different camera from within VR and press the primary button on the handcontroller.

- [40h] The audience can interact by sending emojis and hand clap icons to the room.

- [20h] Admin have detailed control over ticket-urls
  - Admin can revoke access urls
  - Admin can generate new access urls

- [80h] A third party can request unique urls to an event using an API-key. Scenario: cooltickets.se sells tickets to "cool theatre show of doom". In the creation process of the ticket the server at cooltickets.se sends a request to our backend to retrieve the unique url and can then attach it to the created ticket.