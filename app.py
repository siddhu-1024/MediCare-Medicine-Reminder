from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash
)

from models import (
    init_db,
    create_user,
    verify_user,
    get_user_medicines,
    get_db
)


app = Flask(__name__)

app.secret_key = "medicine-reminder-secret-key"

init_db()


# =========================
# HOME
# =========================

@app.route("/")
def home():

    if "user_id" in session:
        return redirect(url_for("dashboard"))

    return render_template("index.html")


# =========================
# REGISTER
# =========================

@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        if not name or not email or not password:

            flash("Please fill all fields.")

            return redirect(url_for("register"))

        if len(password) < 6:

            flash(
                "Password must contain at least 6 characters."
            )

            return redirect(url_for("register"))

        success = create_user(
            name,
            email,
            password
        )

        if success:

            flash(
                "Registration successful. Please login."
            )

            return redirect(url_for("login"))

        flash(
            "Email already registered."
        )

        return redirect(url_for("register"))

    return render_template("register.html")


# =========================
# LOGIN
# =========================

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form.get(
            "email",
            ""
        ).strip().lower()

        password = request.form.get(
            "password",
            ""
        )

        user = verify_user(
            email,
            password
        )

        if user:

            session["user_id"] = user["id"]

            session["user_name"] = user["name"]

            return redirect(
                url_for("dashboard")
            )

        flash(
            "Invalid email or password."
        )

    return render_template("login.html")


# =========================
# DASHBOARD
# =========================

@app.route("/dashboard")
def dashboard():

    if "user_id" not in session:

        return redirect(
            url_for("login")
        )

    medicines = get_user_medicines(
        session["user_id"]
    )

    medicines = [
        dict(medicine)
        for medicine in medicines
    ]

    return render_template(
        "dashboard.html",
        name=session["user_name"],
        medicines=medicines
    )


# =========================
# ADD MEDICINE
# =========================

@app.route(
    "/add-medicine",
    methods=["GET", "POST"]
)
def add_medicine():

    if "user_id" not in session:

        return redirect(
            url_for("login")
        )

    if request.method == "POST":

        name = request.form.get(
            "name",
            ""
        ).strip()

        dose = request.form.get(
            "dose",
            ""
        ).strip()

        frequency = request.form.get(
            "frequency",
            ""
        ).strip()

        start_date = request.form.get(
            "start_date",
            ""
        )

        end_date = request.form.get(
            "end_date",
            ""
        )

        reminder_time = request.form.get(
            "reminder_time",
            ""
        )

        if not all([
            name,
            dose,
            frequency,
            start_date,
            end_date,
            reminder_time
        ]):

            flash(
                "Please fill all fields."
            )

            return redirect(
                url_for("add_medicine")
            )

        connection = get_db()

        connection.execute(
            """
            INSERT INTO medicines
            (
                user_id,
                name,
                dose,
                frequency,
                start_date,
                end_date,
                reminder_time
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session["user_id"],
                name,
                dose,
                frequency,
                start_date,
                end_date,
                reminder_time
            )
        )

        connection.commit()

        connection.close()

        flash(
            "Medicine added successfully!"
        )

        return redirect(
            url_for("dashboard")
        )

    return render_template(
        "add_medicine.html"
    )


# =========================
# EDIT MEDICINE
# =========================

@app.route(
    "/edit-medicine/<int:medicine_id>",
    methods=["GET", "POST"]
)
def edit_medicine(medicine_id):

    if "user_id" not in session:

        return redirect(
            url_for("login")
        )

    connection = get_db()

    medicine = connection.execute(
        """
        SELECT *
        FROM medicines
        WHERE id = ?
        AND user_id = ?
        """,
        (
            medicine_id,
            session["user_id"]
        )
    ).fetchone()

    if medicine is None:

        connection.close()

        flash(
            "Medicine not found."
        )

        return redirect(
            url_for("dashboard")
        )

    if request.method == "POST":

        name = request.form.get(
            "name",
            ""
        ).strip()

        dose = request.form.get(
            "dose",
            ""
        ).strip()

        frequency = request.form.get(
            "frequency",
            ""
        ).strip()

        start_date = request.form.get(
            "start_date",
            ""
        )

        end_date = request.form.get(
            "end_date",
            ""
        )

        reminder_time = request.form.get(
            "reminder_time",
            ""
        )

        if not all([
            name,
            dose,
            frequency,
            start_date,
            end_date,
            reminder_time
        ]):

            connection.close()

            flash(
                "Please fill all fields."
            )

            return redirect(
                url_for(
                    "edit_medicine",
                    medicine_id=medicine_id
                )
            )

        connection.execute(
            """
            UPDATE medicines

            SET
                name = ?,
                dose = ?,
                frequency = ?,
                start_date = ?,
                end_date = ?,
                reminder_time = ?

            WHERE id = ?
            AND user_id = ?
            """,
            (
                name,
                dose,
                frequency,
                start_date,
                end_date,
                reminder_time,
                medicine_id,
                session["user_id"]
            )
        )

        connection.commit()

        connection.close()

        flash(
            "Medicine updated successfully!"
        )

        return redirect(
            url_for("dashboard")
        )

    medicine = dict(medicine)

    connection.close()

    return render_template(
        "edit_medicine.html",
        medicine=medicine
    )


# =========================
# DELETE MEDICINE
# =========================

@app.route(
    "/delete-medicine/<int:medicine_id>",
    methods=["POST"]
)
def delete_medicine(medicine_id):

    if "user_id" not in session:

        return redirect(
            url_for("login")
        )

    connection = get_db()

    connection.execute(
        """
        DELETE FROM medicines

        WHERE id = ?
        AND user_id = ?
        """,
        (
            medicine_id,
            session["user_id"]
        )
    )

    connection.commit()

    connection.close()

    flash(
        "Medicine deleted successfully!"
    )

    return redirect(
        url_for("dashboard")
    )


# =========================
# LOGOUT
# =========================

@app.route("/logout")
def logout():

    session.clear()

    return redirect(
        url_for("login")
    )


# =========================
# RUN APPLICATION
# =========================

if __name__ == "__main__":

    app.run(
        debug=True
    )