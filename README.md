# OrigoShift
OrigoShift is a solution for live streaming several 360-video camera streams with the ability for visitors to jump between cameras in a "google street view" fashion. This is paired with the ability for users to enter a 3D-environment as avatars and interact with each other.
The system is implemented using web technologies. The client side consists of a website running in a browser.

Some of the key features:
- Visitors can use VR headset or desktop computer
- Live streaming of multiple 360-cameras
- Visitors can freely jump between cameras similar to google street view
- Admin can upload a 3D-model (.glb) to be used as VR/3D environment
- Visitors can enter the 3D evironment, where they can move around and talk to each other.
- Avatars in 3D evironment uses spatial audio so visitors can hear each other better when their avatars are standing close.

## Installation
> [!NOTE]
> **Prerequisites**: Initially you will need [Git](https://git-scm.com/) to be able to fetch the repository. Git is installed by default on most linux systems.
Additionally this project use the tool [Ansible](https://www.ansible.com/) to install, update, setup and deploy the project on a server.
To install ansible follow these instructions:
https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html

### 1. Download the repository from github
To install Origoshift and run it on your own server, you first need to retrieve the repository from github.
Using the terminal, go to your home folder on the server:
```
cd ~
```
Clone the repository from github and then go into the root directory of the project:
```
git clone https://github.com/immersed-web/origoshift.git --recurse-submodules
cd origoshift
```

### 2. Configure _.env_ file
This project relies on an .env file to configure relevant aspects of the system.
There is an example called `example.env` in the root folder of the project. This is just an example file. You need to create an .env file (the filename should be **.env**, only), and in this file provide the relevant settings. One way would be to make a copy of the example file with the name .env and change the settings in the new file:
```
cp example.env .env
```
- I strongly advice against using dollarsigns (`$`) anywhere in the .env file as that might fuck up everything (`$` is used for variables in linux/bash/shells).
- Should probably be careful with backslash (`\`) too.

A normal setup would require setting values for:
- EXPOSED_SERVER_URL
- LISTEN_IP
- setting INTERNAL_IP, or possibly, commenting it out
- DATABASE_PASSWORD
- SESSION_KEY
- ADMIN_PASSWORD
- JWT_SECRET


The rest could be left as is.

### 3. Install and setup all da thingz!
You'll need the tool __Ansible__ in order to follow this step. Follow the installation instructions for installing ansible [here](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html) and come back when you have Ansible successfully installed on the server.

Now let's install and setup everything.
cd into the ansible folder where all the playbook files are:
```bash
cd ansible
```
Setup all the system wide tools and dependencies
```bash
ansible-playbook setup_environment.yml
```

__Log off and log back in__. This is needed because the previous script (setup_environment.yml) added some environment variables to the user/profile (.bashrc or equivalent) that only gets loaded when the shell starts. Alternatively, you can manually "source" the shell config manually. e.g. `source ~/.bashrc`, but it's probably more reliable to log off and on again.

Install the internal project dependencies and build the apps
```bash
ansible-playbook setup_project.yml
```

### 4. Now let's run the project 🚀:
Go back to project root folder
```bash
cd ..
```
Run pm2 process manager in the project root (pm2 will pick up the file named ecosystem.config.js in the root, which specifies how to start and run the required processes)
```bash
pm2 start
```

## Update to new version
- start in project root
- stop all the processes: `pm2 delete all`
- go to ansible directory: `cd ansible`
- run the update script: `ansible-playbook dangerous_sync_to_github_version.yml`
- for good measure run: `ansible-playbook setup_environment.yml` (should usually not be needed, but in rare cases some edits are made to the environment/global dependencies)
- run the project setup: `ansible-playbook setup_project.yml`
- go to project root directory: `cd ..`
- run the processes: `pm2 start`

> [!NOTE]
> Note: The file is named **dangerous**_sync_to_github_version.yml because it throws away any local additions/edits to the codebase (including not yet pushed commits). Thus it's only "dangerous" for a development environment and not a production server simply running the application.


## Monitoring
The applications are run with a tool called pm2 that gets installed by the `setup-environment.yml` ansible script. You can interact directly with pm2 using the command line. Here's a few examples:

To list the processes managed by pm2 and their status:
```
pm2 ls
```

To have a real-time look at what the applications are printing to the console while running, run:
```
pm2 logs
```

To do the same for only one running process, append the name. For example:
```
pm2 logs mediaserver
```

To get a terminal based overview dashboard, run:
```
pm2 monit
```

## Ports
The following ports are required to be opened on the server:

| Ports | Protocol  | Description |
| -------: | -------: | :----- |
| 22    | TCP       | If you need to SSH in to the server (you will) |
| 80    | TCP       | Serve standard http requests |
| 443   | TCP       | Serve standard https requests |
| 40000-49999 | UDP | ports for the SFU mediaserver |

## Credit
The project to develop and create this software was initiated by Lèv Grunberg.
The development was a collaboration between the following organisations:
- Reasearch Institutes of Sweden (RISE)
- Kungsbacka Kommun

3D models created by:
- Nisa Tokmak
- Jenn-Li Levin

## Copyright & License
This codebase (excluding external dependencies, such as libraries and/or software frameworks) is written by me, Gunnar Oledal. The project is licensed under MIT. The license text can be found in the file LICENSE in the project root.
External dependencies, such as libraries and/or software frameworks in this repository, holds up to their own respective licenses.
